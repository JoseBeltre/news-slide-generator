// La nube real del sincronizador (§8.4): RPC `sync_push`, lectura por `synced_at` y el bucket privado
// `images`. Traduce cada error de Supabase al tipo que usa el servicio para el indicador.
import type { SupabaseClient } from '@supabase/supabase-js'
import { SyncError, type RemoteRow, type SyncErrorKind, type SyncRemote } from './types'

const BUCKET = 'images'
const COLUMNS = 'id, data, updated_at, deleted_at, synced_at'
/** Las imágenes viven en `images/<hash>.<ext>` dentro del bucket; se listan por páginas. */
const FOLDER = 'images'
const PAGE = 1000

interface ApiError {
  message: string
  code?: string
  statusCode?: string
}

/**
 * Sin red o fetch fallido → offline · sin sesión, JWT vencido o RLS (correo quitado del equipo) → auth ·
 * 5xx y 540 (proyecto pausado) → server · el resto → rejected.
 */
export function classify(error: ApiError, status = 0): SyncError {
  const code = Number(error.statusCode) || status
  let kind: SyncErrorKind = 'rejected'
  if ((typeof navigator !== 'undefined' && navigator.onLine === false) || code === 0 || /fetch|network/i.test(error.message)) kind = 'offline'
  else if (code === 401 || code === 403 || error.code === '42501' || error.code?.startsWith('PGRST30')) kind = 'auth'
  else if (code >= 500) kind = 'server'
  return new SyncError(kind, error.message)
}

const alreadyExists = (e: ApiError) => e.statusCode === '409' || /already exists|duplicate/i.test(e.message)

export function createSupabaseRemote(client: SupabaseClient): SyncRemote {
  return {
    async push(table, rows) {
      const { error, status } = await client.rpc('sync_push', { p_table: table, p_rows: rows })
      if (error) throw classify(error, status)
    },
    async pull(table, since, limit) {
      let query = client.from(table).select(COLUMNS)
      if (since !== null) query = query.gt('synced_at', since)
      const { data, error, status } = await query.order('synced_at', { ascending: true }).limit(limit)
      if (error) throw classify(error, status)
      return (data ?? []) as RemoteRow[]
    },
    async uploadFile(path, blob) {
      const { error } = await client.storage.from(BUCKET).upload(path, blob, { upsert: false, contentType: blob.type })
      if (error && !alreadyExists(error as ApiError)) throw classify(error as ApiError)
    },
    async downloadFile(path) {
      const { data, error } = await client.storage.from(BUCKET).download(path)
      if (error || !data) throw classify((error as ApiError | null) ?? { message: 'Archivo vacío', statusCode: '404' })
      return data
    },
    async usedBytes() {
      let total = 0
      for (let offset = 0; ; offset += PAGE) {
        const { data, error } = await client.storage.from(BUCKET).list(FOLDER, { limit: PAGE, offset })
        if (error) throw classify(error as ApiError)
        const page = data ?? []
        for (const item of page) total += Number(item.metadata?.size ?? 0)
        if (page.length < PAGE) return total
      }
    },
  }
}
