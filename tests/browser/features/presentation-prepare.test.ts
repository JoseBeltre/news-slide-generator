import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRepository } from '../../../src/data/local/repository'
import type { AppDb } from '../../../src/data/local/db'
import type { OfflineEnv } from '../../../src/data/offline'
import { nextSaturday } from '../../../src/data/presentations'
import { OFFLINE_ENV } from '../../../src/features/presentations/shared/useOfflineCheck'
import { toIsoDate } from '../../../src/lib/format'
import { NORMAL } from '../../fixtures/announcements'
import { cleanupMounted } from '../helpers/mount'
import { byLabel, cleanupDbs, mountApp, seed, testDb, until } from '../helpers/app'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

const saturday = nextSaturday(toIsoDate(new Date()))
const LONG =
  'Gran concierto de alabanza y adoración con coros invitados de toda la región este sábado por la noche en el templo central con la participación especial de muchos ministerios'

function fakeEnv(over: Partial<OfflineEnv> = {}): OfflineEnv {
  return {
    requestPersist: vi.fn(async () => true),
    appInstalled: async () => true,
    fontReady: async () => true,
    assetCached: async () => true,
    ...over,
  }
}

async function withPresentation(db: AppDb, titles: string[]) {
  const ids = []
  for (const titulo of titles) ids.push((await seed(db, { typeId: 'culto', values: { ...NORMAL.culto, titulo }, eventDate: saturday })).id)
  return createRepository(db.presentations).put({
    date: saturday,
    items: ids.map((announcementId) => ({ announcementId })),
    showCover: true,
    showClosing: true,
    published: false,
  })
}

describe('Miniaturas y "Preparar sin internet" (RF-54, RF-55)', () => {
  it('portada + 2 anuncios + cierre → 4 miniaturas y "4 slides"; preparar → lista y pide persistencia', async () => {
    const db = testDb()
    const p = await withPresentation(db, ['Vigilia', 'Ayuno'])
    const env = fakeEnv()
    const { host } = await mountApp(`/presentaciones/${p.id}`, db, undefined, { [OFFLINE_ENV]: env })
    await until(() => host.querySelectorAll('[data-thumb]').length === 4)
    expect(host.textContent).toContain('4 slides')
    await until(() => !!byLabel(host, 'Preparar sin internet'))
    byLabel(host, 'Preparar sin internet')!.click()
    await until(() => host.textContent!.includes('✓ Lista para usar sin internet'), 8000)
    expect(env.requestPersist).toHaveBeenCalled()
  })

  it('un anuncio que no cabe en su miniatura bloquea y lo dice', async () => {
    const db = testDb()
    const p = await withPresentation(db, [LONG])
    const { host } = await mountApp(`/presentaciones/${p.id}`, db, undefined, { [OFFLINE_ENV]: fakeEnv() })
    await until(() => !!host.querySelector('[data-thumb][data-status="no_cabe"]'), 8000)
    await until(() => host.textContent!.includes('no cabe en su slide.'), 8000)
    expect(host.textContent).not.toContain('✓ Lista para usar sin internet')
  })

  it('sin Service Worker → dice que la app no está guardada', async () => {
    const db = testDb()
    const p = await withPresentation(db, ['Vigilia'])
    const { host } = await mountApp(`/presentaciones/${p.id}`, db, undefined, { [OFFLINE_ENV]: fakeEnv({ appInstalled: async () => false }) })
    await until(() => host.textContent!.includes('La app aún no está guardada en este equipo'), 8000)
  })
})

describe('Inicio: la presentación del sábado (§6.1)', () => {
  it('sin presentación → el botón la crea y la abre', async () => {
    const db = testDb()
    await seed(db, { typeId: 'culto', values: { ...NORMAL.culto, titulo: 'Vigilia' }, eventDate: saturday })
    const { host, router } = await mountApp('/', db, undefined, { [OFFLINE_ENV]: fakeEnv() })
    await until(() => !!byLabel(host, 'Crear la presentación del sábado'))
    byLabel(host, 'Crear la presentación del sábado')!.click()
    await until(() => router.currentRoute.value.name === 'presentacion')
    expect(await db.presentations.count()).toBe(1)
  })

  it('un anuncio guardado como listo que no cabe con la fecha del sábado no da "✓ Lista" en Inicio', async () => {
    const db = testDb()
    await withPresentation(db, [LONG])
    const { host } = await mountApp('/', db, undefined, { [OFFLINE_ENV]: fakeEnv() })
    await until(() => host.textContent!.includes('falta algo para usar sin internet'), 10000)
    expect(host.textContent).not.toContain('lista sin internet')
  })

  it('con presentación lista → su fecha y «N anuncios · lista sin internet»', async () => {
    const db = testDb()
    await withPresentation(db, ['Vigilia'])
    const { host } = await mountApp('/', db, undefined, { [OFFLINE_ENV]: fakeEnv() })
    await until(() => host.textContent!.includes('1 anuncio · lista sin internet'), 8000)
    expect(host.textContent).not.toContain('Presentación del sábado')
  })
})
