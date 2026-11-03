import { afterEach, describe, expect, it } from 'vitest'
import { createRepository } from '../../../src/data/local/repository'
import { nextSaturday } from '../../../src/data/presentations'
import { toIsoDate } from '../../../src/lib/format'
import { cleanupMounted } from '../helpers/mount'
import { byLabel, cleanupDbs, daysFromToday, mountApp, seed, testDb, until } from '../helpers/app'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

const saturday = nextSaturday(toIsoDate(new Date()))
const presentation = (date: string) => ({ date, items: [], showCover: true, showClosing: true, published: false })

describe('Presentaciones (RF-50, RF-52)', () => {
  it('el encabezado lleva a Presentaciones; el formulario trae el próximo sábado', async () => {
    const db = testDb()
    const { host, router } = await mountApp('/', db)
    byLabel(host, 'Presentaciones')!.click()
    await until(() => router.currentRoute.value.name === 'presentaciones')
    await until(() => !!host.querySelector('input[type="date"]'))
    expect(host.querySelector<HTMLInputElement>('input[type="date"]')!.value).toBe(saturday)
  })

  it('Crear → abre la nueva con los anuncios sugeridos; otra vez la misma fecha → la misma', async () => {
    const db = testDb()
    const sugerido = await seed(db, { typeId: 'culto', values: { titulo: 'Vigilia' }, eventDate: saturday })
    await seed(db, { typeId: 'culto', values: { titulo: 'Pasado' }, eventDate: daysFromToday(-3) })
    const { host, router } = await mountApp('/presentaciones', db)
    await until(() => !!byLabel(host, 'Crear presentación'))
    byLabel(host, 'Crear presentación')!.click()
    await until(() => router.currentRoute.value.name === 'presentacion')
    const id = router.currentRoute.value.params.id as string
    expect((await db.presentations.get(id))!.items).toEqual([{ announcementId: sugerido.id }])

    await router.push('/presentaciones')
    await until(() => !!byLabel(host, 'Crear presentación'))
    byLabel(host, 'Crear presentación')!.click()
    await until(() => router.currentRoute.value.name === 'presentacion')
    expect(router.currentRoute.value.params.id).toBe(id)
    expect(await db.presentations.count()).toBe(1)
  })

  it('próximas y pasadas por separado; eliminar pide confirmación y no borra anuncios', async () => {
    const db = testDb()
    const a = await seed(db, { typeId: 'culto', values: { titulo: 'Vigilia' }, eventDate: saturday })
    const repo = createRepository(db.presentations)
    await repo.put({ ...presentation(saturday), items: [{ announcementId: a.id }] })
    await repo.put(presentation(daysFromToday(-14)))
    const { host } = await mountApp('/presentaciones', db)
    await until(() => host.querySelectorAll('[data-presentation-row]').length === 2)
    const sections = [...host.querySelectorAll('section')].map((s) => s.querySelector('h2')?.textContent)
    expect(sections).toEqual(['Próximas', 'Pasadas'])
    expect(host.querySelector('[data-presentation-row]')!.textContent).toContain('1 anuncio')

    const del = [...host.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.getAttribute('aria-label')?.startsWith('Eliminar la presentación'))!
    del.click()
    await until(() => !!document.querySelector('dialog[open]'))
    expect(document.querySelector('dialog[open]')!.textContent).toContain('Los anuncios no se borran.')
    byLabel(document.querySelector('dialog[open]')!, 'Eliminar')!.click()
    await until(() => host.querySelectorAll('[data-presentation-row]').length === 1)
    expect(await db.announcements.count()).toBe(1)
  })
})
