// Estado de la sincronización para el indicador (RF-101) y espera entre reintentos.
import type { SyncErrorKind } from './types'

export type SyncStatus = 'desactivado' | 'sin-sesion' | 'sin-conexion' | 'nube-no-responde' | 'pendiente' | 'sincronizado'

export interface StatusInput {
  /** Hay variables de Supabase en este build. */
  enabled: boolean
  signedIn: boolean
  online: boolean
  lastError: SyncErrorKind | null
  pending: number
}

/** Prioridad: desactivado > sin sesión > sin conexión > nube no responde > pendiente > sincronizado. */
export function deriveStatus(s: StatusInput): SyncStatus {
  if (!s.enabled) return 'desactivado'
  if (!s.signedIn || s.lastError === 'auth') return 'sin-sesion'
  if (!s.online || s.lastError === 'offline') return 'sin-conexion'
  if (s.lastError === 'server') return 'nube-no-responde'
  return s.pending > 0 ? 'pendiente' : 'sincronizado'
}

const FIRST_RETRY_MS = 30_000
const MAX_RETRY_MS = 15 * 60_000

/** Espera antes de reintentar tras `failures` fallos seguidos: 30 s, 1 min, 2 min… hasta 15 min. */
export const nextDelay = (failures: number): number =>
  failures <= 0 ? 0 : Math.min(FIRST_RETRY_MS * 2 ** (failures - 1), MAX_RETRY_MS)
