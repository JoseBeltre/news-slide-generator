// Esquema de Supabase (§8.5, RNF-11): solo los correos de `editors` leen y escriben; `sync_push`
// nunca pisa una edición más nueva; nadie se quita a sí mismo del equipo; `anon` solo hace ping y
// pregunta si un correo puede entrar; el hook de Auth rechaza correos ajenos.
import type { PGlite } from '@electric-sql/pglite'
import { beforeEach, describe, expect, it } from 'vitest'
import { as, openDb, row } from './helpers'

const ANA = 'ana@iglesia.do'
const LUIS = 'luis@iglesia.do'
const EXTRA = 'extrano@correo.com'
let db: PGlite

beforeEach(async () => {
  db = await openDb()
  await db.query(`insert into public.editors (email) values ($1), ($2)`, [ANA, LUIS])
}, 30_000)

const push = (email: string | null, table: string, rows: object[]) =>
  as<{ n: number }>(db, email, 'select public.sync_push($1, $2::jsonb) as n', [table, JSON.stringify(rows)])

describe('tablas sincronizadas', () => {
  it('un editor sube y la fila llega con synced_at', async () => {
    expect((await push(ANA, 'announcements', [row('a1', '2026-11-03T10:00:00Z')]))[0]!.n).toBe(1)
    const [r] = await as<{ id: string; synced_at: string }>(db, LUIS, 'select id, synced_at from public.announcements')
    expect(r!.id).toBe('a1')
    expect(r!.synced_at).toBeTruthy()
  })

  it('una fila más vieja no pisa la guardada', async () => {
    await push(ANA, 'announcements', [row('a1', '2026-11-03T10:00:00Z', { titulo: 'nuevo' })])
    expect((await push(LUIS, 'announcements', [row('a1', '2026-11-03T09:00:00Z', { titulo: 'viejo' })]))[0]!.n).toBe(0)
    const [r] = await as<{ data: { titulo: string } }>(db, ANA, 'select data from public.announcements')
    expect(r!.data.titulo).toBe('nuevo')
  })

  it('una fila más nueva reemplaza y propaga el borrado lógico', async () => {
    await push(ANA, 'presentations', [row('p1', '2026-11-03T10:00:00Z')])
    await push(LUIS, 'presentations', [row('p1', '2026-11-03T11:00:00Z', { id: 'p1' }, '2026-11-03T11:00:00Z')])
    const [r] = await as<{ deleted_at: string | null }>(db, ANA, 'select deleted_at from public.presentations')
    expect(r!.deleted_at).not.toBeNull()
  })

  it('un correo fuera del equipo no lee ni escribe', async () => {
    await push(ANA, 'announcements', [row('a1', '2026-11-03T10:00:00Z')])
    expect(await as(db, EXTRA, 'select * from public.announcements')).toEqual([])
    await expect(push(EXTRA, 'announcements', [row('a2', '2026-11-03T10:00:00Z')])).rejects.toThrow(/row-level security/)
  })

  it('anon no lee las tablas', async () => {
    await push(ANA, 'announcements', [row('a1', '2026-11-03T10:00:00Z')])
    await expect(as(db, null, 'select * from public.announcements')).rejects.toThrow(/permission denied/)
  })

  it('rechaza una tabla que no se sincroniza', async () => {
    await expect(push(ANA, 'editors', [row('x', '2026-11-03T10:00:00Z')])).rejects.toThrow(/no sincronizable/)
  })
})

describe('equipo', () => {
  it('un editor añade y quita a otro', async () => {
    await as(db, ANA, 'insert into public.editors (email) values ($1)', ['nuevo@iglesia.do'])
    await as(db, ANA, 'delete from public.editors where email = $1', [LUIS])
    const emails = (await as<{ email: string }>(db, ANA, 'select email from public.editors order by email')).map((r) => r.email)
    expect(emails).toEqual([ANA, 'nuevo@iglesia.do'])
  })

  it('nadie se quita a sí mismo', async () => {
    await as(db, ANA, 'delete from public.editors where email = $1', [ANA])
    expect(await as(db, ANA, 'select email from public.editors where email = $1', [ANA])).toHaveLength(1)
  })

  it('alguien de fuera no se añade', async () => {
    await expect(as(db, EXTRA, 'insert into public.editors (email) values ($1)', [EXTRA])).rejects.toThrow(/row-level security/)
  })

  it('los correos se guardan en minúsculas', async () => {
    await expect(as(db, ANA, 'insert into public.editors (email) values ($1)', ['Mayus@Iglesia.do'])).rejects.toThrow(/check/)
  })
})

describe('funciones públicas y hook', () => {
  it('anon hace ping y pregunta si un correo puede entrar', async () => {
    expect((await as<{ p: number }>(db, null, 'select public.ping() as p'))[0]!.p).toBe(1)
    expect((await as<{ ok: boolean }>(db, null, 'select public.can_sign_in($1) as ok', ['  ANA@iglesia.do ']))[0]!.ok).toBe(true)
    expect((await as<{ ok: boolean }>(db, null, 'select public.can_sign_in($1) as ok', [EXTRA]))[0]!.ok).toBe(false)
  })

  it('el hook rechaza crear un usuario fuera del equipo y acepta uno del equipo', async () => {
    const hook = async (email: string) =>
      (await db.query<{ r: { error?: { http_code: number } } }>(`select public.before_user_created($1::jsonb) as r`, [JSON.stringify({ user: { email } })])).rows[0]!.r
    expect((await hook(EXTRA)).error?.http_code).toBe(403)
    expect(await hook('Ana@Iglesia.do')).toEqual({})
  })

  it('el bucket de imágenes es privado y solo para el equipo', async () => {
    const [bucket] = (await db.query<{ public: boolean }>(`select public from storage.buckets where id = 'images'`)).rows
    expect(bucket!.public).toBe(false)
    await as(db, ANA, `insert into storage.objects (bucket_id, name) values ('images', 'images/h.webp')`)
    expect(await as(db, EXTRA, `select * from storage.objects`)).toEqual([])
    await expect(as(db, EXTRA, `insert into storage.objects (bucket_id, name) values ('images', 'images/x.webp')`)).rejects.toThrow(/row-level security/)
  })
})
