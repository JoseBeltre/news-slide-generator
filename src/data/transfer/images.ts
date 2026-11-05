// Imágenes al importar (RF-112): se reutilizan por hash (la misma foto no se guarda dos veces), una
// borrada con ese hash se revive, y los ids del archivo se cambian por los de este equipo.
import type { AppDb } from '../local/db'
import type { ImageAsset } from '../models'

/** Guarda (o reutiliza) las imágenes y devuelve id del archivo → id en este equipo. Va dentro de la transacción. */
export async function importImages(db: AppDb, images: ImageAsset[], blobs: Map<string, Blob>, now: string): Promise<Map<string, string>> {
  const ids = new Map<string, string>()
  for (const image of images) {
    const blob = blobs.get(image.hash)
    const sameHash = await db.images.where('hash').equals(image.hash).toArray()
    const alive = sameHash.find((i) => !i.deletedAt)
    if (alive) {
      ids.set(image.id, alive.id)
      if (blob && !(await db.imageBlobs.get(alive.id))) await db.imageBlobs.put({ id: alive.id, blob })
      continue
    }
    const deleted = sameHash[0]
    const taken = !deleted && (await db.images.get(image.id))
    const id = deleted?.id ?? (taken ? crypto.randomUUID() : image.id)
    // La ruta en la nube sale del hash, nunca del archivo: así no puede apuntar a la foto de otro.
    const storagePath = `images/${image.hash}.${image.storagePath.endsWith('.svg') ? 'svg' : 'webp'}`
    const record: ImageAsset = deleted ? { ...deleted, deletedAt: null, updatedAt: now } : { ...image, id, storagePath, deletedAt: null, updatedAt: now }
    await db.images.put(record)
    if (blob) await db.imageBlobs.put({ id, blob })
    await db.outbox.put({ table: 'images', id })
    ids.set(image.id, id)
  }
  return ids
}

/** Cambia, a cualquier profundidad, las cadenas que son ids de imagen del archivo por las finales. */
export function remapImageIds<T>(value: T, ids: ReadonlyMap<string, string>): T {
  if (typeof value === 'string') return (ids.get(value) ?? value) as T
  if (Array.isArray(value)) return value.map((v) => remapImageIds(v, ids)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, remapImageIds(v, ids)])) as T
  }
  return value
}
