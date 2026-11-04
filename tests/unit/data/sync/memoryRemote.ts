// Servidor falso en memoria con las mismas reglas que Supabase: `push` solo reemplaza si la edición es
// más nueva; `synced_at` crece en cada escritura; los archivos viven en un Map.
import type { SyncTable } from '../../../../src/data/models'
import { SyncError, type RemoteRow, type SyncErrorKind, type SyncRemote } from '../../../../src/data/sync/types'

export interface MemoryRemote extends SyncRemote {
  rows: Map<SyncTable, Map<string, RemoteRow>>
  files: Map<string, Blob>
  /** Orden de las llamadas, p. ej. 'upload:images/h.svg', 'push:images'. */
  log: string[]
  /** Toda llamada falla con ese tipo de error hasta `fail(null)`. */
  fail(kind: SyncErrorKind | null): void
  /** Los `push` a esa tabla se rechazan (4xx). */
  reject(table: SyncTable): void
  /** Un `push` que incluya ese id se rechaza entero (como una restricción de Postgres). */
  rejectId(id: string): void
  /** Se ejecuta dentro de cada `push`, antes de guardar (simula ediciones durante la subida). */
  duringPush?: () => Promise<void>
}

export function memoryRemote(): MemoryRemote {
  const rows = new Map<SyncTable, Map<string, RemoteRow>>()
  const files = new Map<string, Blob>()
  const log: string[] = []
  const rejected = new Set<SyncTable>()
  const rejectedIds = new Set<string>()
  let failure: SyncErrorKind | null = null
  let seq = 0
  const nextSyncedAt = () => new Date(Date.UTC(2026, 10, 3, 12) + ++seq).toISOString()
  const table = (t: SyncTable) => rows.get(t) ?? rows.set(t, new Map()).get(t)!
  const check = () => {
    if (failure) throw new SyncError(failure, `falla simulada: ${failure}`)
  }

  const remote: MemoryRemote = {
    rows,
    files,
    log,
    fail: (kind) => void (failure = kind),
    reject: (t) => void rejected.add(t),
    rejectId: (id) => void rejectedIds.add(id),
    async push(t, batch) {
      check()
      log.push(`push:${t}`)
      if (rejected.has(t) || batch.some((r) => rejectedIds.has(r.id))) throw new SyncError('rejected', `rechazado: ${t}`)
      await remote.duringPush?.()
      for (const r of batch) {
        const current = table(t).get(r.id)
        if (current && Date.parse(r.updated_at) <= Date.parse(current.updated_at)) continue
        table(t).set(r.id, { ...structuredClone(r), synced_at: nextSyncedAt() })
      }
    },
    async pull(t, since, limit) {
      check()
      log.push(`pull:${t}`)
      return [...table(t).values()]
        .filter((r) => since === null || r.synced_at! > since)
        .sort((a, b) => a.synced_at!.localeCompare(b.synced_at!))
        .slice(0, limit)
        .map((r) => structuredClone(r))
    },
    async uploadFile(path, blob) {
      check()
      log.push(`upload:${path}`)
      if (!files.has(path)) files.set(path, blob)
    },
    async downloadFile(path) {
      check()
      const blob = files.get(path)
      if (!blob) throw new SyncError('rejected', `no existe: ${path}`)
      return blob
    },
  }
  return remote
}
