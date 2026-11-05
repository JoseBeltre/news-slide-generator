// Anuncios públicos (P9, §8.5): `public_notices()` entrega solo lo vigente y público, sin notas, autores
// ni fotos; nunca cumpleaños ni flyers; "hoy" es el de Santo Domingo. anon la ejecuta, pero no la interna.
import type { PGlite } from '@electric-sql/pglite'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANNOUNCEMENT_TYPES } from '../../../src/slides/types/definitions'
import { as, openDb, row } from './helpers'

const ANA = 'ana@iglesia.do'
const NOW = '2026-11-05T15:00:00Z'
let db: PGlite

beforeEach(async () => {
  db = await openDb()
  await db.query(`insert into public.editors (email) values ($1)`, [ANA])
}, 30_000)

const push = (table: string, rows: object[]) => as(db, ANA, 'select public.sync_push($1, $2::jsonb) as n', [table, JSON.stringify(rows)])

const notice = (id: string, data: Record<string, unknown> = {}, deletedAt: string | null = null) =>
  row(id, '2026-11-04T10:00:00Z', { id, typeId: 'aviso', status: 'listo', values: { titulo: id }, ...data }, deletedAt)

interface Result {
  today: string
  settings: Record<string, unknown>
  notices: Array<Record<string, unknown> & { id: string; values: Record<string, unknown> }>
}

async function at(now = NOW): Promise<Result> {
  return (await db.query<{ r: Result }>('select public._public_notices_at($1) as r', [now])).rows[0]!.r
}

describe('public_notices', () => {
  it('sale un anuncio vigente y uno sin fecha, ordenados con el sin fecha al final', async () => {
    await push('announcements', [
      notice('a-sin-fecha'),
      notice('a-manana', { eventDate: '2026-11-06' }),
      notice('a-hoy', { eventDate: '2026-11-05' }),
    ])
    expect((await at()).notices.map((n) => n.id)).toEqual(['a-hoy', 'a-manana', 'a-sin-fecha'])
  })

  it('no salen: pasado, borrado, borrador, cumpleanos, imagen, showPublic false', async () => {
    await push('announcements', [
      notice('pasado', { eventDate: '2026-11-04' }),
      notice('borrado', {}, '2026-11-04T11:00:00Z'),
      notice('borrador', { status: 'borrador' }),
      notice('cumple', { typeId: 'cumpleanos' }),
      notice('flyer', { typeId: 'imagen' }),
      notice('oculto', { showPublic: false }),
    ])
    expect((await at()).notices).toEqual([])
    await push('announcements', [notice('visible'), notice('no-cabe', { status: 'no_cabe' }), notice('marcado', { showPublic: true })])
    expect((await at()).notices.map((n) => n.id).sort()).toEqual(['marcado', 'no-cabe', 'visible'])
  })

  it('nunca salen las notas ni los autores ni la foto', async () => {
    const imageKeys = ANNOUNCEMENT_TYPES.filter((t) => t.id !== 'cumpleanos' && t.id !== 'imagen').flatMap((t) =>
      t.fields.filter((f) => f.kind === 'image').map((f) => f.key),
    )
    expect(imageKeys.length).toBeGreaterThan(0)
    const values = Object.fromEntries([['titulo', 'Culto'], ...imageKeys.map((k) => [k, 'img-1'])])
    await push('announcements', [
      notice('c1', { typeId: 'culto', values, presenterNotes: 'secreto', createdBy: ANA, updatedBy: ANA, showPublic: true, eventDate: '2026-11-07' }),
    ])
    const [n] = (await at()).notices
    expect(Object.keys(n!).sort()).toEqual(['eventDate', 'id', 'typeId', 'updatedAt', 'values'])
    expect(n!.values).toEqual({ titulo: 'Culto' })
    expect(n!.eventDate).toBe('2026-11-07')
  })

  it('hoy es el de Santo Domingo', async () => {
    await push('announcements', [notice('hoy', { eventDate: '2026-11-05' })])
    const r = await at('2026-11-06T03:30:00Z')
    expect(r.today).toBe('2026-11-05')
    expect(r.notices.map((n) => n.id)).toEqual(['hoy'])
  })

  it('trae la configuración pública', async () => {
    expect((await at()).settings).toEqual({})
    await push('settings', [row('configuracion', '2026-11-04T10:00:00Z', { timeFormat: '24h', currency: 'USD', dateStyle: 'corto', coverTitle: 'x' })])
    expect((await at()).settings).toEqual({ timeFormat: '24h', currency: 'USD', dateStyle: 'corto' })
  })

  it('anon ejecuta public_notices pero no la interna ni las tablas', async () => {
    await push('announcements', [notice('a1')])
    const [r] = await as<{ r: Result }>(db, null, 'select public.public_notices() as r')
    expect(r!.r.notices.map((n) => n.id)).toEqual(['a1'])
    await expect(as(db, null, 'select public._public_notices_at(now())')).rejects.toThrow(/permission denied/)
    await expect(as(db, null, 'select * from public.announcements')).rejects.toThrow(/permission denied/)
  })
})
