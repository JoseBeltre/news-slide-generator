// Exportar y leer (RF-112): un anuncio o una presentación en un .zip con contenido.json e imagenes/;
// lo que no es una exportación nuestra da TransferFormatError.
import { strToU8, zipSync } from 'fflate'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { saveImage } from '../../../src/data/local/images'
import { createRepository } from '../../../src/data/local/repository'
import type { Announcement } from '../../../src/data/models'
import { TRANSFER_FORMAT, TransferFormatError } from '../../../src/data/transfer/format'
import { exportAnnouncement, exportPresentation } from '../../../src/data/transfer/pack'
import { readTransferFile } from '../../../src/data/transfer/unpack'
import { applyImport, importSummary } from '../../../src/data/transfer/apply'
import { planImport } from '../../../src/data/transfer/plan'
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

describe('aplicar la importación', () => {
  const planOf = async (to: AppDb, exported: Promise<{ blob: Blob }>) => planImport(to, await readTransferFile((await exported).blob))
  const outboxKeys = async (d: AppDb) => (await d.outbox.toArray()).map((e) => `${e.table}:${e.id}`)
  const presentationOf = (d: AppDb, date: string, ids: string[]) =>
    createRepository(d.presentations).put({ date, items: ids.map((announcementId) => ({ announcementId })), showCover: true, showClosing: true, published: false })
  const wait = () => new Promise((r) => setTimeout(r, 5))

  it('ida y vuelta de un anuncio con imagen en otro equipo', async () => {
    const [a, b] = [db(), db()]
    const asset = await saveImage(a, await syntheticFlyer(300, 200), 'flyer')
    const ann = await seed(a, { typeId: 'imagen', templateId: 'imagen', values: { imagen: asset.id }, imageIds: [asset.id] })
    const result = await applyImport(b, await planOf(b, exportAnnouncement(a, ann.id)))
    expect(result).toEqual({ announcementIds: [ann.id] })
    expect((await b.announcements.get(ann.id))!.values).toEqual(ann.values)
    expect((await b.images.get(asset.id))!.hash).toBe(asset.hash)
    expect((await b.imageBlobs.get(asset.id))!.blob.size).toBeGreaterThan(0)
    expect(await outboxKeys(b)).toEqual(expect.arrayContaining([`announcements:${ann.id}`, `images:${asset.id}`]))
  })

  it('copia en el mismo equipo: id nuevo y "(2)", luego "(3)"', async () => {
    const d = db()
    const ann = await seed(d, { typeId: 'aviso', values: { titulo: 'Culto' } })
    const first = await applyImport(d, await planOf(d, exportAnnouncement(d, ann.id)))
    expect(first.announcementIds[0]).not.toBe(ann.id)
    expect((await d.announcements.get(first.announcementIds[0]!))!.values.titulo).toBe('Culto (2)')
    const second = await applyImport(d, await planOf(d, exportAnnouncement(d, ann.id)))
    expect((await d.announcements.get(second.announcementIds[0]!))!.values.titulo).toBe('Culto (3)')
  })

  it('dos anuncios con el mismo título en una presentación copiada', async () => {
    const d = db()
    const x = await seed(d, { typeId: 'aviso', values: { titulo: 'Aviso' } })
    const y = await seed(d, { typeId: 'aviso', values: { tituloInterno: 'Aviso' } })
    const p = await presentationOf(d, '2026-11-07', [x.id, y.id])
    const plan = await planOf(d, exportPresentation(d, p.id))
    plan.presentation!.targetDate = '2026-11-14'
    const r = await applyImport(d, plan)
    const copies = await d.announcements.bulkGet(r.announcementIds)
    expect(copies.map((c) => c!.values.titulo ?? c!.values.tituloInterno)).toEqual(['Aviso (2)', 'Aviso (3)'])
  })

  it('anuncio de imagen sin título se copia sin cambiar values', async () => {
    const d = db()
    const ann = await seed(d, { typeId: 'imagen', values: { nota: 'x' } })
    const r = await applyImport(d, await planOf(d, exportAnnouncement(d, ann.id)))
    expect((await d.announcements.get(r.announcementIds[0]!))!.values).toEqual({ nota: 'x' })
  })

  it('sobrescribir conserva el id y gana por updatedAt', async () => {
    const d = db()
    const ann = await seed(d, { typeId: 'aviso', values: { titulo: 'Antes' } })
    const exported = exportAnnouncement(d, ann.id)
    await exported
    await wait()
    const edited = await createRepository(d.announcements).put({ ...ann, values: { titulo: 'Editado' } })
    const plan = await planOf(d, exported)
    plan.announcements[0]!.resolution = 'sobrescribir'
    await wait()
    const r = await applyImport(d, plan)
    expect(r.announcementIds).toEqual([ann.id])
    const got = (await d.announcements.get(ann.id))!
    expect(got.values.titulo).toBe('Antes')
    expect(got.updatedAt > edited.updatedAt).toBe(true)
    expect(await d.announcements.count()).toBe(1)
  })

  it('presentación sobrescrita con anuncios copiados apunta a las copias', async () => {
    const d = db()
    const x = await seed(d, { typeId: 'aviso', values: { titulo: 'X' } })
    const p = await presentationOf(d, '2026-11-07', [x.id])
    const plan = await planOf(d, exportPresentation(d, p.id))
    plan.presentation!.resolution = 'sobrescribir'
    const r = await applyImport(d, plan)
    expect(r.presentationId).toBe(p.id)
    expect(r.announcementIds[0]).not.toBe(x.id)
    expect((await d.presentations.get(p.id))!.items).toEqual([{ announcementId: r.announcementIds[0] }])
  })

  it('desmarcar un anuncio: no se crea y se quita de items', async () => {
    const [a, b] = [db(), db()]
    const x = await seed(a, { typeId: 'aviso', values: { titulo: 'X' } })
    const y = await seed(a, { typeId: 'aviso', values: { titulo: 'Y' } })
    const p = await presentationOf(a, '2026-11-07', [x.id, y.id])
    const plan = await planOf(b, exportPresentation(a, p.id))
    plan.announcements.find((i) => i.id === y.id)!.included = false
    const r = await applyImport(b, plan)
    expect(r.announcementIds).toEqual([x.id])
    expect(await b.announcements.get(y.id)).toBeUndefined()
    expect((await b.presentations.get(p.id))!.items).toEqual([{ announcementId: x.id }])
  })

  it('imagen con el mismo hash se reutiliza', async () => {
    const [a, b] = [db(), db()]
    const flyer = await syntheticFlyer(300, 200)
    const inA = await saveImage(a, flyer, 'flyer')
    const inB = await saveImage(b, flyer, 'flyer')
    const ann = await seed(a, { typeId: 'imagen', values: { imagen: inA.id }, imageIds: [inA.id] })
    const r = await applyImport(b, await planOf(b, exportAnnouncement(a, ann.id)))
    expect(await b.images.count()).toBe(1)
    const got = (await b.announcements.get(r.announcementIds[0]!))!
    expect(got.imageIds).toEqual([inB.id])
    expect(got.values.imagen).toBe(inB.id)
  })

  it('imagen borrada con el mismo hash se revive y entra en outbox', async () => {
    const [a, b] = [db(), db()]
    const flyer = await syntheticFlyer(300, 200)
    const inA = await saveImage(a, flyer, 'flyer')
    const inB = await saveImage(b, flyer, 'flyer')
    await b.images.update(inB.id, { deletedAt: '2026-11-01T00:00:00.000Z' })
    await b.outbox.clear()
    const ann = await seed(a, { typeId: 'imagen', imageIds: [inA.id] })
    const r = await applyImport(b, await planOf(b, exportAnnouncement(a, ann.id)))
    expect(await b.images.count()).toBe(1)
    expect((await b.images.get(inB.id))!.deletedAt).toBeNull()
    expect((await b.announcements.get(r.announcementIds[0]!))!.imageIds).toEqual([inB.id])
    expect(await outboxKeys(b)).toContain(`images:${inB.id}`)
  })

  it('fecha ocupada sin cambiar: rechaza y no cambia nada', async () => {
    const [a, b] = [db(), db()]
    const x = await seed(a, { typeId: 'aviso', values: { titulo: 'X' } })
    const p = await presentationOf(a, '2026-11-07', [x.id])
    await presentationOf(b, '2026-11-07', [])
    const plan = await planOf(b, exportPresentation(a, p.id))
    const before = [await b.announcements.count(), await b.outbox.count()]
    await expect(applyImport(b, plan)).rejects.toThrow()
    expect([await b.announcements.count(), await b.outbox.count()]).toEqual(before)
  })

  it('error a mitad no deja nada', async () => {
    const [a, b] = [db(), db()]
    const asset = await saveImage(a, await syntheticFlyer(300, 200), 'flyer')
    const x = await seed(a, { typeId: 'imagen', imageIds: [asset.id] })
    const p = await presentationOf(a, '2026-11-07', [x.id])
    const plan = await planOf(b, exportPresentation(a, p.id))
    vi.spyOn(b.presentations, 'put').mockRejectedValue(new Error('falla'))
    await expect(applyImport(b, plan)).rejects.toThrow('falla')
    const counts = [await b.announcements.count(), await b.images.count(), await b.imageBlobs.count(), await b.outbox.count()]
    expect(counts).toEqual([0, 0, 0, 0])
  })

  it('importSummary', () => {
    expect(importSummary({ announcementIds: ['a'] })).toBe('Se importó 1 anuncio')
    expect(importSummary({ announcementIds: ['a', 'b', 'c'] })).toBe('Se importaron 3 anuncios')
    expect(importSummary({ announcementIds: ['a', 'b', 'c'], presentationId: 'p' })).toBe('Se importaron 3 anuncios y 1 presentación')
    expect(importSummary({ announcementIds: ['a'], presentationId: 'p' })).toBe('Se importó 1 anuncio y 1 presentación')
    expect(importSummary({ announcementIds: [], presentationId: 'p' })).toBe('Se importó 1 presentación')
  })
})
