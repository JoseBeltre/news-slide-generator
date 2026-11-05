// Exportar (RF-112): en la fila del anuncio, en el editor de un anuncio guardado y en la presentación;
// se descarga un .zip con el nombre del anuncio o la fecha.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepository } from '../../../src/data/local/repository'
import { cleanupMounted } from '../helpers/mount'
import { byLabel, cleanupDbs, mountApp, seed, testDb, until } from '../helpers/app'

let downloads: { name: string; blob: Blob }[] = []
beforeEach(() => {
  downloads = []
  const blobs = new Map<string, Blob>()
  vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => {
    const url = `blob:test/${blobs.size}`
    blobs.set(url, b as Blob)
    return url
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, blob: blobs.get(this.href)! })
  })
})
afterEach(async () => {
  vi.restoreAllMocks()
  cleanupMounted()
  await cleanupDbs()
})

describe('Exportar', () => {
  it('la fila exporta el anuncio', async () => {
    const db = testDb()
    await seed(db, { typeId: 'aviso', values: { titulo: 'Culto' } })
    const { host } = await mountApp('/anuncios', db)
    await until(() => !!byLabel(host, 'Exportar «Culto»'))
    byLabel(host, 'Exportar «Culto»')!.click()
    await until(() => downloads.length === 1)
    expect(downloads[0]!.name).toBe('anuncio-culto.zip')
    expect(downloads[0]!.blob.type).toBe('application/zip')
  })

  it('el editor de un anuncio guardado tiene Exportar', async () => {
    const db = testDb()
    const a = await seed(db, { typeId: 'aviso', values: { titulo: 'Culto' } })
    const { host } = await mountApp(`/anuncios/${a.id}`, db)
    await until(() => !!byLabel(host, 'Exportar'))
    byLabel(host, 'Exportar')!.click()
    await until(() => downloads.length === 1)
    expect(downloads[0]!.name).toBe('anuncio-culto.zip')
  })

  it('uno nuevo no lo tiene', async () => {
    const { host } = await mountApp('/anuncios/nuevo/aviso', testDb())
    await until(() => !!byLabel(host, 'Guardar'))
    expect(byLabel(host, 'Exportar')).toBeUndefined()
  })

  it('la presentación exporta presentacion-<fecha>.zip', async () => {
    const db = testDb()
    const p = await createRepository(db.presentations).put({ date: '2026-11-07', items: [], showCover: true, showClosing: true, published: false })
    const { host } = await mountApp(`/presentaciones/${p.id}`, db)
    await until(() => !!byLabel(host, 'Exportar'))
    byLabel(host, 'Exportar')!.click()
    await until(() => downloads.length === 1)
    expect(downloads[0]!.name).toBe('presentacion-2026-11-07.zip')
  })
})
