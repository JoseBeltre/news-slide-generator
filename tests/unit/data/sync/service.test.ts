// Servicio de sincronización (RF-101): estado para el indicador, cuándo corre cada vuelta, reintentos
// espaciados y una sola pestaña a la vez.
import 'fake-indexeddb/auto'
import { ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDb, type AppDb } from '../../../../src/data/local/db'
import { createSyncService, type Timers } from '../../../../src/data/sync/service'
import { deriveStatus, nextDelay } from '../../../../src/data/sync/status'
import { SyncError } from '../../../../src/data/sync/types'
import { memoryRemote } from './memoryRemote'

const opened: AppDb[] = []
let n = 0
function device() {
  const d = createDb(`service-test-${++n}`)
  opened.push(d)
  return d
}
afterEach(async () => {
  for (const d of opened.splice(0)) await d.delete()
})

/** Temporizadores manuales: `advance(ms)` dispara lo que vence. */
function manualTimers() {
  let now = 0
  let next = 1
  const pending = new Map<number, { at: number; fn: () => void; every?: number }>()
  const timers: Timers = {
    setTimeout: (fn, ms) => (pending.set(next, { at: now + ms, fn }), next++),
    setInterval: (fn, ms) => (pending.set(next, { at: now + ms, fn, every: ms }), next++),
    clear: (id) => void pending.delete(id),
  }
  async function advance(ms: number) {
    now += ms
    for (const [id, t] of [...pending]) {
      if (t.at > now) continue
      if (t.every) t.at += t.every
      else pending.delete(id)
      t.fn()
    }
    await new Promise((r) => setTimeout(r, 20))
  }
  return { timers, advance, count: () => pending.size }
}

const base = { enabled: true, signedIn: true, online: true, lastError: null, pending: 0 } as const

describe('deriveStatus', () => {
  it.each([
    [{ ...base, enabled: false, signedIn: false }, 'desactivado'],
    [{ ...base, signedIn: false, online: false }, 'sin-sesion'],
    [{ ...base, lastError: 'auth' }, 'sin-sesion'],
    [{ ...base, online: false, lastError: 'server' }, 'sin-conexion'],
    [{ ...base, lastError: 'offline' }, 'sin-conexion'],
    [{ ...base, lastError: 'server', pending: 3 }, 'nube-no-responde'],
    [{ ...base, pending: 3 }, 'pendiente'],
    [{ ...base, lastError: 'rejected', pending: 1 }, 'pendiente'],
    [base, 'sincronizado'],
  ] as const)('%o → %s', (input, expected) => {
    expect(deriveStatus(input)).toBe(expected)
  })
})

describe('nextDelay', () => {
  it('30 s, 1 min, 2 min… hasta 15 min', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(nextDelay)).toEqual([0, 30_000, 60_000, 120_000, 240_000, 480_000, 900_000, 900_000])
  })
})

describe('createSyncService', () => {
  const lock = async <T>(fn: () => Promise<T>) => fn()
  const deps = (db: AppDb, over: Record<string, unknown> = {}) => ({
    db,
    remote: memoryRemote(),
    signedIn: ref(true),
    isPresenting: async () => false,
    withLock: lock,
    timers: manualTimers().timers,
    online: () => true,
    ...over,
  })

  it('sin remoto queda desactivado y no sincroniza', async () => {
    const run = vi.fn()
    const s = createSyncService({ ...deps(device()), remote: null, run })
    await s.syncNow()
    expect(s.state.value.status).toBe('desactivado')
    expect(run).not.toHaveBeenCalled()
  })

  it('tras una vuelta buena queda sincronizado con la hora', async () => {
    const s = createSyncService({ ...deps(device()), now: () => new Date('2026-11-07T09:00:00Z') })
    await s.syncNow()
    expect(s.state.value).toMatchObject({ status: 'sincronizado', pending: 0, lastSyncAt: '2026-11-07T09:00:00.000Z' })
  })

  it('sin sesión no llama a la nube', async () => {
    const run = vi.fn()
    const s = createSyncService({ ...deps(device()), signedIn: ref(false), run })
    await s.syncNow()
    expect(run).not.toHaveBeenCalled()
    expect(s.state.value.status).toBe('sin-sesion')
  })

  it('un error de sesión muestra "sin-sesion" sin reintentar; uno del servidor reintenta a los 30 s', async () => {
    const t = manualTimers()
    const run = vi.fn().mockRejectedValueOnce(new SyncError('auth')).mockRejectedValueOnce(new SyncError('server')).mockResolvedValue({ pushed: 0, pulled: 0 })
    const s = createSyncService({ ...deps(device()), timers: t.timers, run })
    await s.syncNow()
    expect(s.state.value.status).toBe('sin-sesion')
    expect(t.count()).toBe(0)
    await s.syncNow()
    expect(s.state.value.status).toBe('nube-no-responde')
    await t.advance(29_999)
    expect(run).toHaveBeenCalledTimes(2)
    await t.advance(1)
    expect(run).toHaveBeenCalledTimes(3)
    expect(s.state.value.status).toBe('sincronizado')
  })

  it('un cambio en la cola dispara una vuelta a los 2 s', async () => {
    const t = manualTimers()
    const db = device()
    const run = vi.fn().mockResolvedValue({ pushed: 0, pulled: 0 })
    const s = createSyncService({ ...deps(db), timers: t.timers, run })
    s.start()
    await t.advance(0)
    const before = run.mock.calls.length
    await db.outbox.put({ table: 'announcements', id: 'a1' })
    await new Promise((r) => setTimeout(r, 50)) // liveQuery
    expect(s.state.value.pending).toBe(1)
    await t.advance(1_999)
    expect(run.mock.calls.length).toBe(before)
    await t.advance(1)
    expect(run.mock.calls.length).toBe(before + 1)
    s.stop()
  })

  it('si otra pestaña tiene el lock, no cambia el estado', async () => {
    const run = vi.fn()
    const s = createSyncService({ ...deps(device()), withLock: async () => undefined, run })
    const before = s.state.value.status
    await s.syncNow()
    expect(s.state.value.status).toBe(before)
  })

  it('si tras subir quedan pendientes (editado durante la subida), vuelve a los 2 s (revisión)', async () => {
    const t = manualTimers()
    const db = device()
    await db.outbox.put({ table: 'announcements', id: 'a1' })
    const run = vi.fn().mockResolvedValue({ pushed: 1, pulled: 0 }) // la entrada sigue en la cola
    const s = createSyncService({ ...deps(db), timers: t.timers, run })
    await s.syncNow()
    expect(run).toHaveBeenCalledTimes(1)
    await t.advance(2_000)
    expect(run).toHaveBeenCalledTimes(2)
  })
})
