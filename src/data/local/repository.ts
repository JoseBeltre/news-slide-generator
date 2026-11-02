// Repositorio genérico local-first: id en el cliente, updatedAt en cada escritura y borrado lógico (§8.4).
import type { Table } from 'dexie'
import { plainCopy } from '../../lib/plain'
import type { SyncMeta } from '../models'

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
  return {
    async put(record) {
      // Copia profunda: lo guardado no cambia si el llamador sigue editando su objeto.
      const copy = plainCopy(record)
      const saved = { ...copy, id: copy.id ?? crypto.randomUUID(), updatedAt: clock().toISOString() } as T
      await table.put(saved)
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
      await table.update(id, { deletedAt: now, updatedAt: now } as Partial<T> as never)
    },
  }
}
