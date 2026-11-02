import { afterEach, describe, expect, it } from 'vitest'
import AnnouncementRow from '../../../src/features/announcements/shared/AnnouncementRow.vue'
import { byLabel, cleanupDbs, daysFromToday, mountApp, seed, testDb, until } from '../helpers/app'
import { cleanupMounted } from '../helpers/mount'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

const rowTitles = (host: HTMLElement) =>
  [...host.querySelectorAll('[data-announcement-row] [data-title]')].map((el) => el.textContent?.trim())

async function seedThree() {
  const db = testDb()
  await seed(db, { typeId: 'culto', values: { titulo: 'Culto joven', fecha: daysFromToday(3) }, eventDate: daysFromToday(3) })
  await seed(db, { typeId: 'actividad', values: { titulo: 'Feria de salud', fecha: daysFromToday(1) }, eventDate: daysFromToday(1) })
  await seed(db, { typeId: 'culto', values: { titulo: 'Culto pasado', fecha: daysFromToday(-2) }, eventDate: daysFromToday(-2) })
  return db
}

describe('lista de anuncios (RF-08)', () => {
  it('Activos en orden de fecha; Pasados aparte', async () => {
    const { host } = await mountApp('/anuncios', await seedThree())
    await until(() => rowTitles(host).length === 2)
    expect(rowTitles(host)).toEqual(['Feria de salud', 'Culto joven'])
    byLabel(host, 'Pasados')!.click()
    await until(() => rowTitles(host).length === 1)
    expect(rowTitles(host)).toEqual(['Culto pasado'])
  })

  it('el filtro por tipo deja solo ese tipo', async () => {
    const { host } = await mountApp('/anuncios', await seedThree())
    await until(() => rowTitles(host).length === 2)
    byLabel(host, 'Culto / Servicio especial')!.click()
    await until(() => rowTitles(host).length === 1)
    expect(rowTitles(host)).toEqual(['Culto joven'])
  })

  it('Eliminar + confirmar → la fila desaparece y el registro queda con deletedAt', async () => {
    const db = await seedThree()
    const { host } = await mountApp('/anuncios', db)
    await until(() => rowTitles(host).length === 2)
    byLabel(host, 'Eliminar «Culto joven»')!.click()
    await until(() => !!document.querySelector('dialog[open]'))
    expect(document.querySelector('dialog[open]')!.textContent).toContain('¿Eliminar «Culto joven»?')
    byLabel(document.querySelector('dialog[open]')!, 'Eliminar')!.click()
    await until(() => rowTitles(host).length === 1)
    const all = await db.announcements.toArray()
    expect(all.find((a) => a.values.titulo === 'Culto joven')?.deletedAt).toBeTruthy()
  })

  it('Eliminar + Esc → no borra', async () => {
    const db = await seedThree()
    const { host } = await mountApp('/anuncios', db)
    await until(() => rowTitles(host).length === 2)
    byLabel(host, 'Eliminar «Culto joven»')!.click()
    await until(() => !!document.querySelector('dialog[open]'))
    document.querySelector('dialog[open]')!.dispatchEvent(new Event('cancel', { cancelable: true }))
    await until(() => !document.querySelector('dialog[open]'))
    expect(rowTitles(host)).toHaveLength(2)
    expect((await db.announcements.toArray()).every((a) => !a.deletedAt)).toBe(true)
  })

  // Revisión final P4: con el diálogo abierto los atajos no actúan detrás, y cambiar de pantalla lo cierra.
  it('con "¿Eliminar…?" abierto, la tecla N no navega; cambiar de ruta cierra la pregunta sin borrar', async () => {
    const db = await seedThree()
    const { host, router } = await mountApp('/anuncios', db)
    await until(() => rowTitles(host).length === 2)
    byLabel(host, 'Eliminar «Culto joven»')!.click()
    await until(() => !!document.querySelector('dialog[open]'))
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    await new Promise((r) => setTimeout(r, 50))
    expect(router.currentRoute.value.name).toBe('anuncios')
    await router.push('/')
    await until(() => !document.querySelector('dialog[open]'))
    expect((await db.announcements.toArray()).every((a) => !a.deletedAt)).toBe(true)
  })

  it('Duplicar → copia en borrador y abre su editor (RF-02)', async () => {
    const db = await seedThree()
    const { host, router } = await mountApp('/anuncios', db)
    await until(() => rowTitles(host).length === 2)
    byLabel(host, 'Duplicar «Culto joven»')!.click()
    await until(() => router.currentRoute.value.name === 'editar')
    const copies = (await db.announcements.toArray()).filter((a) => a.values.titulo === 'Culto joven')
    expect(copies).toHaveLength(2)
    const copy = copies.find((a) => a.id === router.currentRoute.value.params.id)!
    expect(copy.status).toBe('borrador')
    expect(router.currentRoute.value.query.foco).toBe('fecha')
  })

  it('sin anuncios → invitación a crear uno', async () => {
    const { host } = await mountApp('/anuncios', testDb())
    await until(() => host.textContent!.includes('Todavía no hay anuncios activos.'))
    expect(byLabel(host, 'Nuevo anuncio')).toBeTruthy()
  })

  it('un anuncio sin título dice "Sin título", nunca "undefined" (RNF-10)', async () => {
    const db = testDb()
    await seed(db, { typeId: 'aviso', values: { mensaje: 'Traer sillas' } })
    const { host } = await mountApp('/anuncios', db)
    await until(() => rowTitles(host).length === 1)
    expect(rowTitles(host)).toEqual(['Sin título'])
    expect(host.textContent).not.toContain('undefined')
  })
})

describe('Inicio (§6.1)', () => {
  it('muestra los próximos activos con la misma fila que la lista', async () => {
    const { host, wrapper } = await mountApp('/', await seedThree())
    await until(() => rowTitles(host).length === 2)
    expect(wrapper.findAllComponents(AnnouncementRow)).toHaveLength(2)
    expect(byLabel(host, 'Ver todos')).toBeTruthy()
  })

  it('la tecla N abre "Nuevo anuncio"', async () => {
    const { router } = await mountApp('/', testDb())
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    await until(() => router.currentRoute.value.name === 'nuevo')
  })
})
