// Guardar imágenes localmente (RNF-04, §8.4): se reducen y pasan a WebP antes de guardarse,
// se identifican por su SHA-256 y nunca se guardan dos veces.
import type { ImageAsset, ImageKind } from '../models'
import type { AppDb } from './db'

export class InvalidImageError extends Error {
  constructor() {
    super('No se pudo leer la imagen. Usa un archivo PNG, JPG, WebP o SVG.')
    this.name = 'InvalidImageError'
  }
}

export const MAX_SIDE = Object.freeze({ default: 2560, foto: 1600 })
export const WEBP_QUALITY = 0.82

const RASTER_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const SVG_TYPE = 'image/svg+xml'

export interface PreparedImage {
  blob: Blob
  width: number
  height: number
}

/** Medidas de un SVG: atributos width/height numéricos o, si no, el viewBox. */
function svgSize(text: string): { width: number; height: number } | null {
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0]
  if (!tag) return null
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, 'i').exec(tag)?.[1]
  const px = (v: string | undefined) => (v && /^\s*[\d.]+\s*(px)?\s*$/.test(v) ? parseFloat(v) : NaN)
  let width = px(attr('width'))
  let height = px(attr('height'))
  if (!(width > 0 && height > 0)) {
    const box = attr('viewBox')?.trim().split(/[\s,]+/).map(Number)
    if (box?.length === 4) [width, height] = [box[2]!, box[3]!]
  }
  return width > 0 && height > 0 ? { width, height } : null
}

export async function prepareImage(blob: Blob, kind: ImageKind): Promise<PreparedImage> {
  if (blob.type === SVG_TYPE) {
    const size = svgSize(await blob.text())
    if (!size) throw new InvalidImageError()
    return { blob, ...size }
  }
  if (!RASTER_TYPES.has(blob.type)) throw new InvalidImageError()

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
  } catch {
    throw new InvalidImageError()
  }
  try {
    const maxSide = kind === 'foto' ? MAX_SIDE.foto : MAX_SIDE.default
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height)) // nunca se agranda
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new InvalidImageError()
    ctx.drawImage(bitmap, 0, 0, width, height)
    const webp = await canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY })
    return { blob: webp, width, height }
  } finally {
    bitmap.close()
  }
}

async function sha256Hex(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function saveImage(
  db: AppDb,
  blob: Blob,
  kind: ImageKind,
  clock: () => Date = () => new Date(),
): Promise<ImageAsset> {
  const prepared = await prepareImage(blob, kind)
  const hash = await sha256Hex(prepared.blob)
  const now = clock().toISOString()

  return db.transaction('rw', db.images, db.imageBlobs, async () => {
    const existing = await db.images.where('hash').equals(hash).first()
    if (existing && !existing.deletedAt) return existing
    if (existing) {
      // Borrada antes: se revive (el índice único de `hash` impide crear otra).
      const revived: ImageAsset = { ...existing, deletedAt: null, updatedAt: now }
      await db.images.put(revived)
      await db.imageBlobs.put({ id: existing.id, blob: prepared.blob })
      return revived
    }
    const ext = prepared.blob.type === SVG_TYPE ? 'svg' : 'webp'
    const asset: ImageAsset = {
      id: crypto.randomUUID(),
      updatedAt: now,
      storagePath: `images/${hash}.${ext}`,
      hash,
      width: prepared.width,
      height: prepared.height,
      kind,
    }
    await db.images.add(asset)
    await db.imageBlobs.add({ id: asset.id, blob: prepared.blob })
    return asset
  })
}

export async function getImageBlob(db: AppDb, id: string): Promise<Blob | undefined> {
  return (await db.imageBlobs.get(id))?.blob
}
