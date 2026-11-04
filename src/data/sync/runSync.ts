// Una vuelta de sincronización (§8.4): subir la cola, bajar los cambios (salvo durante una
// presentación) y descargar los archivos de imagen que falten.
import type { AppDb } from '../local/db'
import { downloadMissingImages } from './images'
import { pullAll } from './pull'
import { pushAll } from './push'
import type { SyncRemote } from './types'

export interface RunSyncOptions {
  /** Con el presentador o la ventana única abiertos no se aplica nada de lo que baja. */
  isPresenting: () => Promise<boolean>
  now?: () => Date
}

export async function runSync(db: AppDb, remote: SyncRemote, opts: RunSyncOptions): Promise<{ pushed: number; pulled: number }> {
  const pushed = await pushAll(db, remote)
  let pulled = 0
  if (!(await opts.isPresenting())) {
    pulled = await pullAll(db, remote, opts.isPresenting)
    await downloadMissingImages(db, remote)
  }
  await db.syncState.put({ key: 'lastSyncAt', value: (opts.now?.() ?? new Date()).toISOString() })
  return { pushed, pulled }
}
