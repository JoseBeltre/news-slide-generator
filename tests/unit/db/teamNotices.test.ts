// Vista del equipo (P9, spec §6.5): `team_notices()` solo la llama un editor con sesión; trae lo mismo que la
// pública más el predicador y el contacto privado (nunca la foto) y no mira el interruptor de Configuración.
import type { PGlite } from '@electric-sql/pglite'
import { beforeEach, describe, expect, it } from 'vitest'
import { as, openDb, row } from './helpers'

const ANA = 'ana@iglesia.do'
const NOW = '2026-11-05T15:00:00Z'
let db: PGlite

beforeEach(async () => {
  db = await openDb()
  await db.query(`insert into public.editors (email) values ($1)`, [ANA])
}, 30_000)

const push = (table: string, rows: object[]) => as(db, ANA, 'select public.sync_push($1, $2::jsonb) as n', [table, JSON.stringify(rows)])

interface Result {
  enabled: boolean
  notices: Array<{ id: string; values: Record<string, unknown> }>
}

const VALUES = { titulo: 'Culto', predicador: 'Pr. Juan Pérez', fotoPredicador: 'img-1', contacto: 'María 809', contactoPublico: 'Habla con el Director' }

async function seed() {
  await push('announcements', [row('c1', '2026-11-04T10:00:00Z', { id: 'c1', typeId: 'culto', status: 'listo', values: VALUES, presenterNotes: 'secreto', eventDate: '2026-11-07' })])
}

describe('team_notices', () => {
  it('un editor ve el predicador y el contacto privado, nunca la foto ni las notas', async () => {
    await seed()
    const r = (await db.query<{ r: Result }>('select public._team_notices_at($1) as r', [NOW])).rows[0]!.r
    expect(r.notices.map((n) => n.id)).toEqual(['c1'])
    expect(r.notices[0]!.values).toEqual({ titulo: 'Culto', predicador: 'Pr. Juan Pérez', contacto: 'María 809', contactoPublico: 'Habla con el Director' })
    expect(Object.keys(r.notices[0]!)).not.toContain('presenterNotes')
  })

  it('con publicPage equipo el equipo sigue viendo sus anuncios', async () => {
    await seed()
    await push('settings', [row('configuracion', '2026-11-04T10:00:00Z', { publicPage: 'equipo' })])
    const [r] = await as<{ r: Result }>(db, ANA, 'select public.team_notices() as r')
    expect(r!.r.enabled).toBe(true)
    expect(r!.r.notices.map((n) => n.id)).toEqual(['c1'])
  })

  it('anon no la puede llamar, ni la interna', async () => {
    await expect(as(db, null, 'select public.team_notices()')).rejects.toThrow(/permission denied/)
    await expect(as(db, null, 'select public._team_notices_at(now())')).rejects.toThrow(/permission denied/)
    await expect(as(db, ANA, 'select public._team_notices_at(now())')).rejects.toThrow(/permission denied/)
  })

  it('alguien con sesión que no es del equipo recibe un error', async () => {
    await seed()
    await expect(as(db, 'otro@correo.com', 'select public.team_notices()')).rejects.toThrow(/equipo/)
  })
})
