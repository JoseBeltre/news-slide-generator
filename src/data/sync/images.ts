// Archivos de imagen que faltan en este equipo (§8.4): los registros llegan al bajar y el archivo se
// descarga aparte, para que presentar sin internet tenga todo.
import type { AppDb } from '../local/db'
import { isFatal, type SyncRemote } from './types'

/** Descarga los archivos de las imágenes vivas que no están en `imageBlobs`. Devuelve cuántos bajó. */
export async function downloadMissingImages(db: AppDb, remote: SyncRemote): Promise<number> {
  const images = (await db.images.toArray()).filter((i) => !i.deletedAt)
  const present = new Set((await db.imageBlobs.toCollection().primaryKeys()) as string[])
  let downloaded = 0
  for (const image of images.filter((i) => !present.has(i.id))) {
    try {
      await db.imageBlobs.put({ id: image.id, blob: await remote.downloadFile(image.storagePath) })
      downloaded++
    } catch (e) {
      if (isFatal(e)) throw e // sin red o sin sesión: se reintenta en la próxima vuelta
    }
  }
  return downloaded
}
