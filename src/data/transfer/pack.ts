// Exportar (RF-112): un anuncio o una presentación (con sus anuncios vivos) y sus imágenes a un .zip.
// Las imágenes ya vienen comprimidas: se guardan sin volver a comprimir.
import { strToU8, zipSync, type Zippable } from 'fflate'
import { slugify } from '../../lib/slug'
import { displayTitle } from '../announcements'
import type { AppDb } from '../local/db'
import { createRepository } from '../local/repository'
import type { Announcement, ImageAsset } from '../models'
import { CONTENT_FILE, IMAGES_DIR, TRANSFER_FORMAT, TRANSFER_VERSION, type TransferFile } from './format'

export interface ExportedFile {
  name: string
  blob: Blob
}

export const imageFileName = (image: Pick<ImageAsset, 'hash' | 'storagePath'>) =>
  `${IMAGES_DIR}${image.hash}.${image.storagePath.split('.').pop() ?? 'webp'}`

export async function exportAnnouncement(db: AppDb, id: string, now = new Date()): Promise<ExportedFile> {
  const announcement = await createRepository(db.announcements).get(id)
  if (!announcement) throw new Error('No existe')
  const slug = slugify(displayTitle(announcement) ?? '') || announcement.typeId
  return pack(db, { tipo: 'anuncio', announcements: [announcement] }, `anuncio-${slug}.zip`, now)
}

export async function exportPresentation(db: AppDb, id: string, now = new Date()): Promise<ExportedFile> {
  const presentation = await createRepository(db.presentations).get(id)
  if (!presentation) throw new Error('No existe')
  const repo = createRepository(db.announcements)
  const alive = new Map<string, Announcement>()
  for (const { announcementId } of presentation.items) {
    if (alive.has(announcementId)) continue
    const a = await repo.get(announcementId)
    if (a) alive.set(announcementId, a)
  }
  const items = presentation.items.filter((i) => alive.has(i.announcementId))
  const content = { tipo: 'presentacion' as const, presentation: { ...presentation, items }, announcements: [...alive.values()] }
  return pack(db, content, `presentacion-${presentation.date}.zip`, now)
}

async function pack(
  db: AppDb,
  content: Pick<TransferFile, 'tipo' | 'presentation' | 'announcements'>,
  name: string,
  now: Date,
): Promise<ExportedFile> {
  const ids = [...new Set(content.announcements.flatMap((a) => a.imageIds))]
  const images = (await db.images.bulkGet(ids)).filter((i): i is ImageAsset => !!i)
  const file: TransferFile = { formato: TRANSFER_FORMAT, version: TRANSFER_VERSION, exportadoEn: now.toISOString(), images, ...content }
  const files: Zippable = { [CONTENT_FILE]: strToU8(JSON.stringify(file)) }
  for (const image of images) {
    const blob = (await db.imageBlobs.get(image.id))?.blob
    if (blob) files[imageFileName(image)] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }]
  }
  return { name, blob: new Blob([zipSync(files) as Uint8Array<ArrayBuffer>], { type: 'application/zip' }) }
}
