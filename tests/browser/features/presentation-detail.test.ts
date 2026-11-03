import { afterEach, describe, expect, it } from 'vitest'
import { createRepository } from '../../../src/data/local/repository'
import type { AppDb } from '../../../src/data/local/db'
import { nextSaturday } from '../../../src/data/presentations'
import { toIsoDate } from '../../../src/lib/format'
import { cleanupMounted } from '../helpers/mount'
import { byLabel, cleanupDbs, mountApp, seed, testDb, until } from '../helpers/app'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

const saturday = nextSaturday(toIsoDate(new Date()))

async function setup(extra: (db: AppDb) => Promise<string[]> = async () => []) {
  const db = testDb()
  const a = await seed(db, { typeId: 'culto', values: { titulo: 'Vigilia' }, eventDate: saturday })
  const b = await seed(db, { typeId: 'culto', values: { titulo: 'Ayuno' }, eventDate: saturday })
  const more = await extra(db)
  const p = await createRepository(db.presentations).put({
    date: saturday,
    items: [a.id, b.id, ...more].map((announcementId) => ({ announcementId })),
    showCover: true,
    showClosing: true,
    published: false,
  })
  const mounted = await mountApp(`/presentaciones/${p.id}`, db)
  await until(() => !!byLabel(mounted.host, 'Bajar «Vigilia»'))
  const saved = async () => (await db.presentations.get(p.id))!
  return { db, a, b, p, saved, ...mounted }
}

describe('Armar la presentación (RF-51, RF-53)', () => {
  it('bajar guarda el orden; quitar deja el anuncio en la base', async () => {
    const { host, a, b, db, saved } = await setup()
    byLabel(host, 'Bajar «Vigilia»')!.click()
    await until(async () => (await saved()).items[0]!.announcementId === b.id)
    byLabel(host, 'Quitar «Vigilia»')!.click()
    await until(async () => (await saved()).items.length === 1)
    expect(await db.announcements.get(a.id)).toBeDefined()
  })

  it('agregar un anuncio sin fecha lo pone al final', async () => {
    const { host, db, saved } = await setup()
    const aviso = await seed(db, { typeId: 'aviso', values: { titulo: 'Recordatorio' } })
    await until(() => !!byLabel(host, 'Agregar «Recordatorio»'))
    byLabel(host, 'Agregar «Recordatorio»')!.click()
    await until(async () => (await saved()).items.at(-1)?.announcementId === aviso.id)
  })

  it('un anuncio borrado se ve como "Anuncio eliminado" con Quitar', async () => {
    const { host } = await setup(async (db) => {
      const gone = await seed(db, { typeId: 'culto', values: { titulo: 'Viejo' } })
      await createRepository(db.announcements).remove(gone.id)
      return [gone.id]
    })
    await until(() => host.textContent!.includes('Anuncio eliminado'))
    expect(byLabel(host, 'Quitar «Anuncio eliminado»')).toBeDefined()
    expect(host.textContent).not.toContain('undefined')
  })

  it('portada, su título y cierre se guardan', async () => {
    const { host, saved } = await setup()
    const portada = [...host.querySelectorAll('label')].find((l) => l.textContent!.trim() === 'Portada')!.querySelector('input')!
    portada.click()
    await until(async () => (await saved()).showCover === false)
    portada.click()
    await until(async () => (await saved()).showCover === true)
    await until(() => !!host.querySelector('#titulo-portada'))
    const title = host.querySelector<HTMLInputElement>('#titulo-portada')!
    expect(title.placeholder).toBe('Anuncios')
    title.value = 'Avisos'
    title.dispatchEvent(new Event('input'))
    await until(async () => (await saved()).coverTitle === 'Avisos')
    ;[...host.querySelectorAll('label')].find((l) => l.textContent!.trim() === 'Cierre')!.querySelector('input')!.click()
    await until(async () => (await saved()).showClosing === false)
  })

  it('el estilo de portada y cierre se elige en la presentación (por defecto, el de Configuración)', async () => {
    const { host, saved } = await setup()
    const group = host.querySelector('[aria-label="Estilo de la portada y el cierre"]')!
    const option = (name: string) => [...group.querySelectorAll('button')].find((b) => b.textContent!.includes(name))!
    expect(option('Almanaque').getAttribute('aria-checked')).toBe('true')
    option('Cartel').click()
    await until(async () => (await saved()).slideStyle === 'cartel')
    await until(() => option('Cartel').getAttribute('aria-checked') === 'true')
  })

  it('cambios seguidos sin esperar a la base no se pisan (título y cierre; bajar y quitar)', async () => {
    const { host, a, saved } = await setup()
    const title = host.querySelector<HTMLInputElement>('#titulo-portada')!
    title.value = 'Avisos'
    title.dispatchEvent(new Event('input'))
    ;[...host.querySelectorAll('label')].find((l) => l.textContent!.trim() === 'Cierre')!.querySelector('input')!.click()
    byLabel(host, 'Bajar «Vigilia»')!.click()
    byLabel(host, 'Quitar «Ayuno»')!.click()
    await until(async () => (await saved()).showClosing === false)
    await new Promise((r) => setTimeout(r, 300))
    expect(await saved()).toMatchObject({ coverTitle: 'Avisos', showClosing: false, items: [{ announcementId: a.id }] })
  })

  it('una id inexistente muestra el estado vacío', async () => {
    const { host } = await mountApp('/presentaciones/no-existe', testDb())
    await until(() => host.textContent!.includes('Esta presentación ya no existe.'))
    expect(byLabel(host, 'Ver presentaciones')).toBeDefined()
  })
})
