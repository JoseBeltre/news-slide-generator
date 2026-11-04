// Contrato entre el motor de sincronización y la nube (§8.4). En producción lo implementa Supabase
// (supabaseRemote.ts); en las pruebas, un servidor en memoria.
import type { SyncTable } from '../models'

/** Una fila tal como vive en la nube: el registro de Dexie en `data` más sus marcas de tiempo. */
export interface RemoteRow {
  id: string
  data: Record<string, unknown>
  /** Hora de la edición en el equipo: decide los conflictos. */
  updated_at: string
  deleted_at: string | null
  /** Hora de llegada al servidor: cursor para bajar cambios. Solo en lo que baja. */
  synced_at?: string
}

export interface SyncRemote {
  /** Sube un lote; el servidor solo reemplaza las filas cuya edición es más nueva. */
  push(table: SyncTable, rows: RemoteRow[]): Promise<void>
  /** Filas con `synced_at > since` (todas si `since` es null), en orden de llegada. */
  pull(table: SyncTable, since: string | null, limit: number): Promise<RemoteRow[]>
  /** "Ya existe" cuenta como éxito: la ruta es el hash del contenido. */
  uploadFile(path: string, blob: Blob): Promise<void>
  downloadFile(path: string): Promise<Blob>
}

/**
 * offline: no hay red · auth: sin sesión o el correo ya no es del equipo · server: Supabase pausado o
 * caído · rejected: el servidor rechazó esta petición concreta (no frena a las demás).
 */
export type SyncErrorKind = 'offline' | 'auth' | 'server' | 'rejected'

export class SyncError extends Error {
  constructor(
    readonly kind: SyncErrorKind,
    message: string = kind,
  ) {
    super(message)
    this.name = 'SyncError'
  }
}

/** Los errores de un registro o una tabla se saltan; los de red, sesión o servidor detienen la vuelta. */
export const isFatal = (e: unknown): boolean => !(e instanceof SyncError && e.kind === 'rejected')
