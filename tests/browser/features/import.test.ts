// Importar (RF-112): revisión con "Ya está en este equipo", copia por defecto o sobrescribir, anuncios
// con casilla en una presentación, fecha ocupada que bloquea, y la pantalla de hecho con su resumen.
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppDb } from '../../../src/data/local/db'
import { createRepository } from '../../../src/data/local/repository'
import { exportAnnouncement, exportPresentation } from '../../../src/data/transfer/pack'
import { readTransferFile } from '../../../src/data/transfer/unpack'
import { setPendingImport } from '../../../src/features/transfer/shared/pendingImport'
import { cleanupMounted } from '../helpers/mount'
import { byLabel, cleanupDbs, mountApp, seed, testDb, until } from '../helpers/app'

afterEach(async () => {
  vi.restoreAllMocks()
  setPendingImport(null)
  cleanupMounted()
  await cleanupDbs()
})

const presentationOf = (d: AppDb, date: string, ids: string[]) =>
  createRepository(d.presentations).put({ date, items: ids.map((announcementId) => ({ announcementId })), showCover: true, showClosing: true, published: false })

async function review(db: AppDb, file: Promise<{ blob: Blob }>) {
  setPendingImport({ bundle: await readTransferFile((await file).blob) })
  const app = await mountApp('/importar', db)
  await until(() => !!byLabel(app.host, 'Importar') && !!app.host.querySelector('[data-import-item]'))
  return app
}

const importButton = (host: HTMLElement) => byLabel(host, 'Importar') as HTMLButtonElement
const titles = async (db: AppDb) => (await createRepository(db.announcements).list()).map((a) => a.values.titulo).sort()

describe('Importar', () => {
  it('un anuncio que ya está muestra "Ya está en este equipo" y copia por defecto', async () => {
    const db = testDb()
    const a = await seed(db, { typeId: 'aviso', values: { titulo: 'Culto' } })
    const { host } = await review(db, exportAnnouncement(db, a.id))
    expect(host.textContent).toContain('Ya está en este equipo')
    expect(byLabel(host, 'Importar como copia')!.getAttribute('aria-checked')).toBe('true')
    importButton(host).click()
    await until(() => !!host.textContent?.includes('Se importó 1 anuncio'))
    expect(await titles(db)).toEqual(['Culto', 'Culto (2)'])
  })

  it('cambiar a Sobrescribir conserva el id', async () => {
    const db = testDb()
    const a = await seed(db, { typeId: 'aviso', values: { titulo: 'Culto' } })
    const { host } = await review(db, exportAnnouncement(db, a.id))
    byLabel(host, 'Sobrescribir')!.click()
    await until(() => byLabel(host, 'Sobrescribir')!.getAttribute('aria-checked') === 'true')
    importButton(host).click()
    await until(() => !!byLabel(host, 'Abrir el anuncio'))
    expect(await db.announcements.count()).toBe(1)
    expect(byLabel(host, 'Abrir el anuncio')!.getAttribute('href')).toBe(`/anuncios/${a.id}`)
  })

  it('en una presentación, desmarcar un anuncio lo excluye', async () => {
    const [a, b] = [testDb(), testDb()]
    const x = await seed(a, { typeId: 'aviso', values: { titulo: 'X' } })
    const y = await seed(a, { typeId: 'aviso', values: { titulo: 'Y' } })
    const p = await presentationOf(a, '2026-11-07', [x.id, y.id])
    const { host } = await review(b, exportPresentation(a, p.id))
    const boxes = [...host.querySelectorAll<HTMLInputElement>('[data-import-item] input[type="checkbox"]')]
    expect(boxes).toHaveLength(2)
    boxes[1]!.click()
    await until(() => !boxes[1]!.checked)
    importButton(host).click()
    await until(() => !!host.textContent?.includes('Se importó 1 anuncio y 1 presentación'))
    expect(await titles(b)).toEqual(['X'])
    expect((await b.presentations.get(p.id))!.items).toEqual([{ announcementId: x.id }])
    expect(byLabel(host, 'Abrir la presentación')!.getAttribute('href')).toBe(`/presentaciones/${p.id}`)
  })

  it('fecha ocupada: Importar deshabilitado hasta elegir otra', async () => {
    const [a, b] = [testDb(), testDb()]
    const x = await seed(a, { typeId: 'aviso', values: { titulo: 'X' } })
    const p = await presentationOf(a, '2026-11-07', [x.id])
    await presentationOf(b, '2026-11-07', [])
    const { host } = await review(b, exportPresentation(a, p.id))
    expect(host.textContent).toContain('Elige otra fecha.')
    expect(importButton(host).disabled).toBe(true)
    const date = host.querySelector<HTMLInputElement>('input[type="date"]')!
    date.value = '2026-11-14'
    date.dispatchEvent(new Event('input'))
    await until(() => !importButton(host).disabled)
    importButton(host).click()
    await until(() => !!host.textContent?.includes('Se importó'))
    const dates = (await createRepository(b.presentations).list()).map((q) => q.date).sort()
    expect(dates).toEqual(['2026-11-07', '2026-11-14'])
  })

  it('si no se puede preparar la revisión, lo dice', async () => {
    const db = testDb()
    const a = await seed(db, { typeId: 'aviso', values: { titulo: 'Culto' } })
    setPendingImport({ bundle: await readTransferFile((await exportAnnouncement(db, a.id)).blob) })
    vi.spyOn(db.announcements, 'bulkGet').mockRejectedValue(new Error('falla'))
    const { host } = await mountApp('/importar', db)
    await until(() => !!host.textContent?.includes('No se pudo preparar la importación.'))
    expect(host.textContent).toContain('Elegir otro archivo')
  })

  it('si llegan dos archivos seguidos, gana el último', async () => {
    const db = testDb()
    const first = await seed(db, { typeId: 'aviso', values: { titulo: 'Primero' } })
    const second = await seed(db, { typeId: 'aviso', values: { titulo: 'Segundo' } })
    const [b1, b2] = [await readTransferFile((await exportAnnouncement(db, first.id)).blob), await readTransferFile((await exportAnnouncement(db, second.id)).blob)]
    const original = db.announcements.bulkGet.bind(db.announcements)
    let calls = 0
    const slowFirst = async (keys: string[]) => {
      if (calls++ === 0) await new Promise((r) => setTimeout(r, 300))
      return original(keys)
    }
    vi.spyOn(db.announcements, 'bulkGet').mockImplementation(slowFirst as never)
    setPendingImport({ bundle: b1 })
    const { host } = await mountApp('/importar', db)
    setPendingImport({ bundle: b2 })
    await until(() => !!host.textContent?.includes('Segundo'))
    await new Promise((r) => setTimeout(r, 500))
    expect(host.textContent).toContain('Segundo')
    expect(host.textContent).not.toContain('Primero')
  })

  it('error de formato', async () => {
    setPendingImport({ error: 'Este archivo no es una exportación de Anuncios del Sábado.' })
    const { host } = await mountApp('/importar', testDb())
    await until(() => !!host.textContent?.includes('Este archivo no es una exportación de Anuncios del Sábado.'))
    expect(host.textContent).toContain('Elegir otro archivo')
  })

  it('sin archivo pendiente', async () => {
    const { host } = await mountApp('/importar', testDb())
    await until(() => !!host.textContent?.includes('Elige un archivo exportado de Anuncios del Sábado.'))
  })

  it.each(['/anuncios', '/presentaciones'])('%s tiene el botón Importar', async (path) => {
    const { host } = await mountApp(path, testDb())
    await until(() => !!host.querySelector('input[type="file"][accept*=".zip"]'))
    expect(host.querySelector('input[type="file"][accept*=".zip"]')!.closest('label')!.textContent).toContain('Importar')
  })
})
