// Repositorio genérico local-first: id en el cliente, updatedAt en cada escritura y borrado lógico (§8.4).
// Si la base tiene `outbox`, cada escritura deja ahí { table, id } en la misma transacción.
import type { Table } from 'dexie'
import { plainCopy } from '../../lib/plain'
import type { OutboxEntry, SyncMeta, SyncTable } from '../models'

export type NewRecord<T extends SyncMeta> = Omit<T, 'id' | 'updatedAt'> & { id?: string }

export interface Repository<T extends SyncMeta> {
  put(record: NewRecord<T>): Promise<T>
  /** `undefined` si no existe o está borrado. */
  get(id: string): Promise<T | undefined>
  /** Sin borrados, por `updatedAt` descendente. */
  list(): Promise<T[]>
  remove(id: string): Promise<void>
}

export function createRepository<T extends SyncMeta>(
  table: Table<T, string>,
  clock: () => Date = () => new Date(),
): Repository<T> {
  const isAlive = (r: T | undefined): r is T => r !== undefined && !r.deletedAt
  const outbox = table.db.tables.find((t) => t.name === 'outbox') as Table<OutboxEntry> | undefined
  /** Escribe y encola juntos: nada queda guardado sin estar pendiente de subir. */
  const write = <R>(fn: () => Promise<R>, id: () => string): Promise<R> =>
    outbox
      ? table.db.transaction('rw', table, outbox, async () => {
          const result = await fn()
          await outbox.put({ table: table.name as SyncTable, id: id() })
          return result
        })
      : fn()

  return {
    async put(record) {
      // Copia profunda: lo guardado no cambia si el llamador sigue editando su objeto.
      const copy = plainCopy(record)
      const saved = { ...copy, id: copy.id ?? crypto.randomUUID(), updatedAt: clock().toISOString() } as T
      await write(() => table.put(saved), () => saved.id)
      return plainCopy(saved)
    },
    async get(id) {
      const r = await table.get(id)
      return isAlive(r) ? r : undefined
    },
    async list() {
      const all = await table.orderBy('updatedAt').reverse().toArray()
      return all.filter(isAlive)
    },
    async remove(id) {
      const now = clock().toISOString()
      await write(() => table.update(id, { deletedAt: now, updatedAt: now } as Partial<T> as never), () => id)
    },
  }
}
