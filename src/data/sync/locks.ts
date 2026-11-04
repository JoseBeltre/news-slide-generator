// Locks entre pestañas (Web Locks): una sola pestaña sincroniza, y nada de lo que baja se aplica
// mientras una pestaña presenta (§8.4). Sin la API (navegador viejo) se sincroniza sin coordinar.
export const SYNC_LOCK = 'anuncios-sync'
export const PRESENTING_LOCK = 'anuncios-presentando'

const locks = (): LockManager | undefined => (typeof navigator !== 'undefined' ? navigator.locks : undefined)

/** Ejecuta `fn` si esta pestaña obtiene el lock de sincronización; si otra lo tiene, `undefined`. */
export async function withSyncLock<T>(fn: () => Promise<T>): Promise<T | undefined> {
  const manager = locks()
  if (!manager) return fn()
  return manager.request(SYNC_LOCK, { ifAvailable: true }, async (lock) => (lock ? fn() : undefined))
}

/** Alguna pestaña tiene abierto el presentador o la ventana única. */
export async function isPresenting(): Promise<boolean> {
  const manager = locks()
  if (!manager) return false
  const { held = [] } = await manager.query()
  return held.some((l) => l.name === PRESENTING_LOCK)
}

/** Toma el lock compartido de "presentando" hasta llamar a la función devuelta. */
export function holdPresentingLock(): () => void {
  const manager = locks()
  let release = () => {}
  if (manager) void manager.request(PRESENTING_LOCK, { mode: 'shared' }, () => new Promise<void>((r) => (release = r)))
  return () => release()
}
