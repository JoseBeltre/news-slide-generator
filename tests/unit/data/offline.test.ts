import { describe, expect, it, vi } from 'vitest'
import type { Announcement, Ministry, Presentation } from '../../../src/data/models'
import { checkOffline, issueMessage, type OfflineEnv, type OfflineIssue } from '../../../src/data/offline'
import { PRELOADED_MINISTRIES } from '../../../src/data/ministries'
import { NORMAL } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'

const culto: Announcement = {
  id: 'a1',
  updatedAt: '2026-11-01T00:00:00.000Z',
  createdAt: '2026-11-01T00:00:00.000Z',
  typeId: 'culto',
  templateId: 'clasica',
  values: { ...NORMAL.culto },
  imageIds: ['foto-1'],
  logo: { kind: 'iglesia' },
  status: 'listo',
  eventDate: '2026-11-07',
}
const presentation: Presentation = {
  id: 'p1',
  updatedAt: '2026-11-01T00:00:00.000Z',
  date: '2026-11-07',
  items: [{ announcementId: 'a1' }],
  showCover: true,
  showClosing: true,
  published: false,
}

function env(over: Partial<OfflineEnv> = {}): OfflineEnv {
  return {
    requestPersist: vi.fn(async () => true),
    appInstalled: async () => true,
    fontReady: async () => true,
    assetCached: async () => true,
    ...over,
  }
}
const input = (over: Partial<Parameters<typeof checkOffline>[0]> = {}) => ({
  presentation,
  byId: new Map([[culto.id, culto]]),
  ctx: makeCtx(),
  hasImage: async () => true,
  ...over,
})

describe('checkOffline (RF-55, RF-102)', () => {
  it('todo en el equipo → lista, sin pedir almacenamiento persistente', async () => {
    const e = env()
    expect(await checkOffline(input(), e)).toEqual({ ready: true, issues: [], persistent: true })
    expect(e.requestPersist).not.toHaveBeenCalled()
  })

  it('falta la foto de un anuncio → imagen con su título', async () => {
    const r = await checkOffline(input({ hasImage: async (id) => id !== 'foto-1' }), env())
    expect(r.ready).toBe(false)
    expect(r.issues).toEqual([{ kind: 'imagen', announcementId: 'a1', title: 'Semana de oración' }])
  })

  it('sin Service Worker → app; sin la letra → fuente', async () => {
    const r = await checkOffline(input(), env({ appInstalled: async () => false, fontReady: async () => false }))
    expect(r.issues).toEqual([{ kind: 'app' }, { kind: 'fuente' }])
  })

  it('logo precargado sin caché → app (viene con la app); logo subido sin blob → logo del ministerio', async () => {
    const jovenes: Ministry = {
      id: 'propio',
      updatedAt: '2026-11-01T00:00:00.000Z',
      name: 'Sociedad propia',
      isChurch: false,
      logos: [{ source: { kind: 'image', imageId: 'logo-propio' }, color: 'negro', orientation: 'horizontal' }],
    }
    const a = { ...culto, imageIds: [], logo: { kind: 'varios' as const, ministryIds: ['iglesia', 'propio'] } }
    const r = await checkOffline(
      input({ byId: new Map([[a.id, a]]), ctx: makeCtx({ ministries: [...PRELOADED_MINISTRIES, jovenes] }), hasImage: async () => false }),
      env({ assetCached: async () => false }),
    )
    expect(r.issues).toEqual([{ kind: 'logo', ministry: 'Sociedad propia' }, { kind: 'app' }])
  })

  it('sin Service Worker y sin logos precargados → un solo aviso de app', async () => {
    const r = await checkOffline(input(), env({ appInstalled: async () => false, assetCached: async () => false }))
    expect(r.issues).toEqual([{ kind: 'app' }])
  })

  it('con persist: lo pide; si el navegador lo niega, sigue lista pero no persistente', async () => {
    const e = env({ requestPersist: vi.fn(async () => false) })
    expect(await checkOffline(input(), e, { persist: true })).toEqual({ ready: true, issues: [], persistent: false })
    expect(e.requestPersist).toHaveBeenCalledOnce()
  })

  it('los problemas de contenido también cuentan', async () => {
    const r = await checkOffline(input({ presentation: { ...presentation, items: [] } }), env())
    expect(r).toMatchObject({ ready: false, issues: [{ kind: 'vacia' }] })
  })
})

describe('issueMessage', () => {
  it('un texto para cada problema', () => {
    const cases: [OfflineIssue, string][] = [
      [{ kind: 'app' }, 'La app aún no está guardada en este equipo. Recarga la página con internet y vuelve a comprobar.'],
      [{ kind: 'fuente' }, 'Falta la letra de las slides en este equipo.'],
      [{ kind: 'imagen', announcementId: 'a', title: 'Culto' }, 'Falta una imagen de «Culto». Ábrelo y vuelve a subirla.'],
      [{ kind: 'logo', ministry: 'Jóvenes' }, 'Falta el logo de Jóvenes.'],
      [{ kind: 'vacia' }, 'La presentación no tiene anuncios.'],
      [{ kind: 'eliminado', index: 0 }, 'Hay un anuncio eliminado en la lista. Quítalo.'],
      [{ kind: 'borrador', announcementId: 'a', title: 'Culto' }, '«Culto» está incompleto.'],
      [{ kind: 'no_cabe', announcementId: 'a', title: 'Culto' }, '«Culto» no cabe en su slide.'],
    ]
    for (const [issue, text] of cases) expect(issueMessage(issue)).toBe(text)
  })
})
