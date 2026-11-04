// Bajar cambios (§8.4): por tabla, lo que llegó al servidor desde el cursor (repasando un minuto hacia
// atrás, porque aplicar dos veces no hace daño). Un registro se aplica solo si es más nuevo que el local,
// y nunca entra en la cola de salida.
import type { Table } from 'dexie'
import type { AppDb } from '../local/db'
import { SYNC_TABLES, type SyncMeta, type SyncTable } from '../models'
import type { RemoteRow, SyncRemote } from './types'

export const PULL_PAGE = 500
export const CURSOR_OVERLAP_MS = 60_000
export const cursorKey = (table: SyncTable) => `cursor:${table}`

const iso = (t: string) => new Date(t).toISOString()

/** Baja y aplica todas las tablas. Devuelve cuántos registros cambiaron en este equipo. */
export async function pullAll(db: AppDb, remote: SyncRemote): Promise<number> {
  let applied = 0
  for (const table of SYNC_TABLES) applied += await pullTable(db, remote, table)
  return applied
}

async function pullTable(db: AppDb, remote: SyncRemote, table: SyncTable): Promise<number> {
  const cursor = (await db.syncState.get(cursorKey(table)))?.value ?? null
  let since = cursor === null ? null : new Date(Date.parse(cursor) - CURSOR_OVERLAP_MS).toISOString()
  let latest = cursor
  let applied = 0
  for (;;) {
    const rows = await remote.pull(table, since, PULL_PAGE)
    if (rows.length === 0) break
    applied += await applyRows(db, table, rows)
    since = rows.at(-1)!.synced_at!
    if (latest === null || Date.parse(since) > Date.parse(latest)) latest = iso(since)
    if (rows.length < PULL_PAGE) break
  }
  if (latest !== null && latest !== cursor) await db.syncState.put({ key: cursorKey(table), value: latest })
  return applied
}

async function applyRows(db: AppDb, table: SyncTable, rows: RemoteRow[]): Promise<number> {
  const store = db.table(table) as Table<SyncMeta, string>
  return db.transaction('rw', store, db.outbox, async () => {
    let applied = 0
    for (const row of rows) {
      const local = await store.get(row.id)
      if (local && Date.parse(local.updatedAt) >= Date.parse(row.updated_at)) continue // gana lo local
      await store.put({ ...row.data, id: row.id, updatedAt: iso(row.updated_at), deletedAt: row.deleted_at && iso(row.deleted_at) })
      // Lo pendiente era más viejo que lo que llegó: ya no hay nada que subir.
      await db.outbox.delete([table, row.id])
      applied++
    }
    return applied
  })
}
