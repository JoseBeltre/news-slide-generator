import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { createRepository } from '../../../src/data/local/repository'
import {
  CHURCH_MINISTRY_ID,
  PRELOADED_MINISTRIES,
  listMinistries,
  logoCandidatesFor,
  logoUrlFor,
} from '../../../src/data/ministries'
import type { Ministry } from '../../../src/data/models'
import { selectLogoVariant } from '../../../src/slides/engine/logo'

const jovenes: Ministry = {
  id: 'jovenes',
  updatedAt: '2026-11-01T00:00:00.000Z',
  name: 'Sociedad de Jóvenes',
  isChurch: false,
  logos: [
    { source: { kind: 'image', imageId: 'img-jov' }, color: 'color', dominantColor: '#c62828', orientation: 'horizontal' },
  ],
}
const ministerios = [...PRELOADED_MINISTRIES, jovenes]

describe('iglesia precargada (RF-35)', () => {
  it('4 variantes: negro y blanco, horizontal y vertical', () => {
    const iglesia = PRELOADED_MINISTRIES[0]!
    expect(iglesia).toMatchObject({ id: CHURCH_MINISTRY_ID, isChurch: true })
    expect(CHURCH_MINISTRY_ID).toBe('iglesia')
    expect(iglesia.logos.map((l) => [l.color, l.orientation])).toEqual([
      ['negro', 'horizontal'],
      ['blanco', 'horizontal'],
      ['negro', 'vertical'],
      ['blanco', 'vertical'],
    ])
    for (const l of iglesia.logos) {
      expect(l.source.kind).toBe('asset')
      if (l.source.kind === 'asset') expect(l.source.src).toMatch(new RegExp(`iasd-${l.orientation}-${l.color}`))
    }
  })
})

describe('logoCandidatesFor (RF-09, RF-38)', () => {
  it('iglesia → sus 4 logos; ninguno → []', () => {
    expect(logoCandidatesFor({ kind: 'iglesia' }, ministerios)).toHaveLength(4)
    expect(logoCandidatesFor({ kind: 'ninguno' }, ministerios)).toEqual([])
  })

  it('ministerio existente → sus logos, con id = imageId y dominantColor', () => {
    expect(logoCandidatesFor({ kind: 'ministerio', ministryId: 'jovenes' }, ministerios)).toEqual([
      { id: 'img-jov', color: 'color', dominantColor: '#c62828', orientation: 'horizontal' },
    ])
  })

  it('ministerio borrado o inexistente → [] (la slide no deja hueco)', () => {
    expect(logoCandidatesFor({ kind: 'ministerio', ministryId: 'mujer' }, ministerios)).toEqual([])
    const borrado = { ...jovenes, deletedAt: '2026-11-01T01:00:00.000Z' }
    expect(logoCandidatesFor({ kind: 'ministerio', ministryId: 'jovenes' }, [...PRELOADED_MINISTRIES, borrado])).toEqual([])
  })

  it('con el motor: fondo oscuro → blanco; claro → negro; respeta la orientación', () => {
    const c = logoCandidatesFor({ kind: 'iglesia' }, PRELOADED_MINISTRIES)
    expect(selectLogoVariant(c, '#0b1f3a')!.candidate.id).toMatch(/iasd-horizontal-blanco/)
    expect(selectLogoVariant(c, '#ffffff')!.candidate.id).toMatch(/iasd-horizontal-negro/)
    expect(selectLogoVariant(c, '#ffffff', { orientation: 'vertical' })!.candidate.id).toMatch(/iasd-vertical-negro/)
    expect(selectLogoVariant(c, '#777777')!.plate).toBeNull()
  })
})

describe('logoUrlFor', () => {
  it('resuelve asset e image; desconocido → undefined', () => {
    const asset = PRELOADED_MINISTRIES[0]!.logos[0]!.source
    if (asset.kind !== 'asset') throw new Error('se esperaba asset')
    expect(logoUrlFor(asset.src, ministerios)).toEqual(asset)
    expect(logoUrlFor('img-jov', ministerios)).toEqual({ kind: 'image', imageId: 'img-jov' })
    expect(logoUrlFor('nada', ministerios)).toBeUndefined()
  })
})

describe('listMinistries', () => {
  const opened: AppDb[] = []
  let n = 0
  afterEach(async () => {
    for (const d of opened.splice(0)) await d.delete()
  })

  it('iglesia primero, luego por nombre, sin borrados, sin reemplazar la iglesia', async () => {
    const db = createDb(`ministries-test-${++n}`)
    opened.push(db)
    const repo = createRepository(db.ministries)
    await repo.put({ name: 'Sociedad de Jóvenes', isChurch: false, logos: [] })
    await repo.put({ name: 'Escuela Sabática', isChurch: false, logos: [] })
    await repo.put({ name: 'Ministerio de la Mujer', isChurch: false, logos: [] })
    const borrado = await repo.put({ name: 'Antiguo', isChurch: false, logos: [] })
    await repo.remove(borrado.id)
    await repo.put({ id: 'iglesia', name: 'Impostora', isChurch: true, logos: [] })

    const lista = await listMinistries(db)
    expect(lista.map((m) => m.name)).toEqual([
      PRELOADED_MINISTRIES[0]!.name,
      'Escuela Sabática',
      'Ministerio de la Mujer',
      'Sociedad de Jóvenes',
    ])
    expect(lista[0]!.logos).toHaveLength(4)
  })
})
