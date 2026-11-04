// Subir la cola (§8.4): por tabla, lee el registro actual de cada entrada y lo envía en lotes. Solo quita
// de la cola lo que no se volvió a editar mientras se subía. Las imágenes suben antes su archivo.
import type { Table } from 'dexie'
import type { AppDb } from '../local/db'
import { SYNC_TABLES, type ImageAsset, type SyncMeta, type SyncTable } from '../models'
import { isFatal, type RemoteRow, type SyncRemote } from './types'

export const PUSH_BATCH = 100

export const toRemoteRow = (r: SyncMeta): RemoteRow => ({
  id: r.id,
  data: r as unknown as Record<string, unknown>,
  updated_at: r.updatedAt,
  deleted_at: r.deletedAt ?? null,
})

/** Sube todo lo pendiente. Devuelve cuántos registros confirmó el servidor. */
export async function pushAll(db: AppDb, remote: SyncRemote): Promise<number> {
  const entries = await db.outbox.toArray()
  let pushed = 0
  for (const table of SYNC_TABLES) {
    const ids = entries.filter((e) => e.table === table).map((e) => e.id)
    if (ids.length === 0) continue
    try {
      pushed += await pushTable(db, remote, table, ids)
    } catch (e) {
      if (isFatal(e)) throw e
      // Rechazada: se queda en la cola y se reintenta en la próxima vuelta.
    }
  }
  return pushed
}

async function pushTable(db: AppDb, remote: SyncRemote, table: SyncTable, ids: string[]): Promise<number> {
  const store = db.table(table) as Table<SyncMeta, string>
  const records = await store.bulkGet(ids)
  const ready: SyncMeta[] = []
  for (const [i, record] of records.entries()) {
    if (!record) await db.outbox.delete([table, ids[i]!]) // ya no existe: nada que subir
    else if (table !== 'images' || (await uploadImageFile(db, remote, record as ImageAsset))) ready.push(record)
  }

  let pushed = 0
  for (let start = 0; start < ready.length; start += PUSH_BATCH) {
    const batch = ready.slice(start, start + PUSH_BATCH)
    await remote.push(table, batch.map(toRemoteRow))
    await db.transaction('rw', store, db.outbox, async () => {
      for (const sent of batch) {
        const current = await store.get(sent.id)
        if (current?.updatedAt === sent.updatedAt) await db.outbox.delete([table, sent.id])
      }
    })
    pushed += batch.length
  }
  return pushed
}

/** `false` si el archivo aún no está en este equipo o el servidor lo rechazó: el registro espera. */
async function uploadImageFile(db: AppDb, remote: SyncRemote, image: ImageAsset): Promise<boolean> {
  if (image.deletedAt) return true
  const blob = (await db.imageBlobs.get(image.id))?.blob
  if (!blob) return false
  try {
    await remote.uploadFile(image.storagePath, blob)
    return true
  } catch (e) {
    if (isFatal(e)) throw e
    return false
  }
}
