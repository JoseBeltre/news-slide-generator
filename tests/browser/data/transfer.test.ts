// Exportar y leer (RF-112): un anuncio o una presentación en un .zip con contenido.json e imagenes/;
// lo que no es una exportación nuestra da TransferFormatError.
import { strToU8, zipSync } from 'fflate'
import { afterEach, describe, expect, it } from 'vitest'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { saveImage } from '../../../src/data/local/images'
import { createRepository } from '../../../src/data/local/repository'
import type { Announcement } from '../../../src/data/models'
import { TRANSFER_FORMAT, TransferFormatError } from '../../../src/data/transfer/format'
import { exportAnnouncement, exportPresentation } from '../../../src/data/transfer/pack'
import { readTransferFile } from '../../../src/data/transfer/unpack'
import { syntheticFlyer } from '../../fixtures/images'

const opened: AppDb[] = []
function db() {
  const d = createDb(`transfer-test-${crypto.randomUUID()}`)
  opened.push(d)
  return d
}
afterEach(async () => {
  for (const d of opened.splice(0)) await d.delete()
})

function seed(d: AppDb, partial: Partial<Announcement> & { typeId: string }) {
  return createRepository(d.announcements).put({
    templateId: 'clasica',
    logo: { kind: 'iglesia' },
    values: {},
    imageIds: [],
    status: 'listo',
    createdAt: new Date().toISOString(),
    ...partial,
  })
}

const zipOf = (files: Record<string, Uint8Array>) => new Blob([zipSync(files) as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
const contentFile = (content: unknown) => zipOf({ 'contenido.json': strToU8(JSON.stringify(content)) })

describe('exportar y leer', () => {
  it('exportar y leer un anuncio devuelve lo mismo', async () => {
    const d = db()
    const asset = await saveImage(d, await syntheticFlyer(400, 300), 'flyer')
    const a = await seed(d, { typeId: 'imagen', templateId: 'imagen', values: { titulo: 'Culto de Jóvenes', imagen: asset.id }, imageIds: [asset.id] })
    const { name, blob } = await exportAnnouncement(d, a.id)
    expect(name).toBe('anuncio-culto-de-jovenes.zip')
    expect(blob.type).toBe('application/zip')
    const { content, blobs } = await readTransferFile(blob)
    expect(content).toMatchObject({ formato: TRANSFER_FORMAT, version: 1, tipo: 'anuncio' })
    expect(content.announcements[0]).toEqual(a)
    expect(content.images[0]!.hash).toBe(asset.hash)
    const saved = (await d.imageBlobs.get(asset.id))!.blob
    expect(blobs.get(asset.hash)!.size).toBe(saved.size)
    expect(blobs.get(asset.hash)!.type).toBe(saved.type)
  })

  it('anuncio sin título se llama anuncio-<typeId>.zip', async () => {
    const d = db()
    const a = await seed(d, { typeId: 'cumpleanos' })
    expect((await exportAnnouncement(d, a.id)).name).toBe('anuncio-cumpleanos.zip')
  })

  it('exportar una presentación incluye sus anuncios vivos en orden', async () => {
    const d = db()
    const [x, y, z] = [await seed(d, { typeId: 'aviso', values: { titulo: 'X' } }), await seed(d, { typeId: 'aviso', values: { titulo: 'Y' } }), await seed(d, { typeId: 'aviso', values: { titulo: 'Z' } })]
    await createRepository(d.announcements).remove(y.id)
    const p = await createRepository(d.presentations).put({
      date: '2026-11-07',
      items: [{ announcementId: z.id }, { announcementId: y.id }, { announcementId: x.id }, { announcementId: z.id }],
      showCover: true,
      showClosing: true,
      published: false,
    })
    const { name, blob } = await exportPresentation(d, p.id)
    expect(name).toBe('presentacion-2026-11-07.zip')
    const { content } = await readTransferFile(blob)
    expect(content.tipo).toBe('presentacion')
    expect(content.announcements.map((a) => a.id)).toEqual([z.id, x.id])
    expect(content.presentation!.items).toEqual([{ announcementId: z.id }, { announcementId: x.id }, { announcementId: z.id }])
  })

  it('un zip cualquiera da TransferFormatError', async () => {
    await expect(readTransferFile(zipOf({ 'hola.txt': strToU8('hola') }))).rejects.toBeInstanceOf(TransferFormatError)
    await expect(readTransferFile(new Blob(['no soy un zip']))).rejects.toThrow('Este archivo no es una exportación de Anuncios del Sábado.')
  })

  it('version 2 da TransferFormatError', async () => {
    const d = db()
    const a = await seed(d, { typeId: 'aviso' })
    const { content } = await readTransferFile((await exportAnnouncement(d, a.id)).blob)
    await expect(readTransferFile(contentFile({ ...content, version: 2 }))).rejects.toBeInstanceOf(TransferFormatError)
    await expect(readTransferFile(contentFile({ ...content, announcements: [a, a] }))).rejects.toBeInstanceOf(TransferFormatError)
    await expect(readTransferFile(contentFile({ ...content, announcements: [{ ...a, typeId: 'otro' }] }))).rejects.toBeInstanceOf(TransferFormatError)
  })

  it('si falta el Blob se exporta igual', async () => {
    const d = db()
    const asset = await saveImage(d, await syntheticFlyer(200, 200), 'flyer')
    await d.imageBlobs.delete(asset.id)
    const a = await seed(d, { typeId: 'imagen', imageIds: [asset.id] })
    const { content, blobs } = await readTransferFile((await exportAnnouncement(d, a.id)).blob)
    expect(content.images.map((i) => i.id)).toEqual([asset.id])
    expect(blobs.has(asset.hash)).toBe(false)
  })

  it('no existe → error', async () => {
    await expect(exportAnnouncement(db(), 'nada')).rejects.toThrow('No existe')
  })
})
