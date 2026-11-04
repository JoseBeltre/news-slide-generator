// Servicio de sincronización (§8.4, RF-101): decide cuándo corre cada vuelta y expone el estado al
// indicador. Corre al arrancar, al volver la red o la pestaña, 2 s después del último cambio y cada
// 5 min; tras un fallo de red o de servidor reintenta cada vez más espaciado. Una sola pestaña a la vez.
import { liveQuery } from 'dexie'
import { computed, ref, watch, type Ref } from 'vue'
import type { AppDb } from '../local/db'
import { runSync } from './runSync'
import { deriveStatus, nextDelay, type SyncStatus } from './status'
import { SyncError, type SyncErrorKind, type SyncRemote } from './types'

export const DEBOUNCE_MS = 2_000
export const INTERVAL_MS = 5 * 60_000

export interface Timers {
  setTimeout(fn: () => void, ms: number): number
  setInterval(fn: () => void, ms: number): number
  clear(id: number): void
}

const browserTimers: Timers = {
  setTimeout: (fn, ms) => window.setTimeout(fn, ms),
  setInterval: (fn, ms) => window.setInterval(fn, ms),
  clear: (id) => {
    window.clearTimeout(id)
    window.clearInterval(id)
  },
}

export interface SyncServiceDeps {
  db: AppDb
  /** `null` sin variables de Supabase: el servicio queda desactivado. */
  remote: SyncRemote | null
  signedIn: Readonly<Ref<boolean>>
  isPresenting: () => Promise<boolean>
  /** Ejecuta `fn` si esta pestaña obtiene el lock; si otra lo tiene, devuelve `undefined`. */
  withLock: <T>(fn: () => Promise<T>) => Promise<T | undefined>
  timers?: Timers
  online?: () => boolean
  now?: () => Date
  /** Para las pruebas. */
  run?: typeof runSync
}

export interface SyncState {
  status: SyncStatus
  pending: number
  lastSyncAt: string | null
}

export interface SyncService {
  state: Readonly<Ref<SyncState>>
  syncNow(): Promise<void>
  start(): void
  stop(): void
}

export function createSyncService(deps: SyncServiceDeps): SyncService {
  const timers = deps.timers ?? browserTimers
  const isOnline = deps.online ?? (() => navigator.onLine)
  const run = deps.run ?? runSync
  const online = ref(isOnline())
  const pending = ref(0)
  const lastError = ref<SyncErrorKind | null>(null)
  const lastSyncAt = ref<string | null>(null)
  let failures = 0
  let retry: number | undefined
  let debounce: number | undefined
  let interval: number | undefined
  let subscription: { unsubscribe(): void } | undefined
  const cleanups: (() => void)[] = []

  const state = computed<SyncState>(() => ({
    status: deriveStatus({
      enabled: deps.remote !== null,
      signedIn: deps.signedIn.value,
      online: online.value,
      lastError: lastError.value,
      pending: pending.value,
    }),
    pending: pending.value,
    lastSyncAt: lastSyncAt.value,
  }))

  const refreshPending = async () => void (pending.value = await deps.db.outbox.count())
  /** Una vuelta 2 s después del último cambio. */
  const schedule = () => {
    if (debounce !== undefined) timers.clear(debounce)
    debounce = timers.setTimeout(() => void syncNow(), DEBOUNCE_MS)
  }

  async function syncNow(): Promise<void> {
    const remote = deps.remote
    online.value = isOnline()
    if (!remote || !deps.signedIn.value) return
    if (retry !== undefined) timers.clear(retry)
    retry = undefined
    let pushedSome = false
    try {
      const done = await deps.withLock(() => run(deps.db, remote, { isPresenting: deps.isPresenting, now: deps.now }))
      if (done === undefined) return // otra pestaña está sincronizando
      pushedSome = done.pushed > 0
      lastError.value = null
      failures = 0
      lastSyncAt.value = (await deps.db.syncState.get('lastSyncAt'))?.value ?? null
    } catch (e) {
      if (!(e instanceof SyncError)) console.error('Sincronización falló', e)
      const kind = e instanceof SyncError ? e.kind : 'server'
      lastError.value = kind
      // Sin sesión no sirve reintentar: se sincroniza al volver a entrar.
      if (kind !== 'auth') retry = timers.setTimeout(() => void syncNow(), nextDelay(++failures))
    } finally {
      await refreshPending()
    }
    // Se editó algo mientras se subía: queda en la cola sin que el conteo crezca. Si la vuelta subió algo
    // (no es un registro rechazado una y otra vez), otra vuelta en 2 s.
    if (pushedSome && pending.value > 0) schedule()
  }

  function start(): void {
    if (!deps.remote) return
    let first = true
    subscription = liveQuery(() => deps.db.outbox.count()).subscribe({
      next: (count) => {
        const grew = count > pending.value
        pending.value = count
        if (grew && !first) schedule()
        first = false
      },
    })
    interval = timers.setInterval(() => void syncNow(), INTERVAL_MS)
    if (typeof window !== 'undefined') {
      const onOnline = () => void syncNow()
      const onOffline = () => void (online.value = false)
      const onVisible = () => document.visibilityState === 'visible' && void syncNow()
      window.addEventListener('online', onOnline)
      window.addEventListener('offline', onOffline)
      document.addEventListener('visibilitychange', onVisible)
      cleanups.push(() => {
        window.removeEventListener('online', onOnline)
        window.removeEventListener('offline', onOffline)
        document.removeEventListener('visibilitychange', onVisible)
      })
    }
    // Al entrar, sincroniza enseguida.
    cleanups.push(watch(deps.signedIn, (yes) => yes && void syncNow()))
    void syncNow()
  }

  function stop(): void {
    subscription?.unsubscribe()
    for (const id of [retry, debounce, interval]) if (id !== undefined) timers.clear(id)
    for (const fn of cleanups.splice(0)) fn()
  }

  void refreshPending()
  return { state, syncNow, start, stop }
}
