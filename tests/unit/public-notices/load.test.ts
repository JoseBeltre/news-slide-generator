// Carga de la página pública (P9, RF-73): pide `public_notices`, guarda la última respuesta buena y, sin
// red o con error, muestra la guardada. Una respuesta con otra forma nunca pisa la caché.
import { describe, expect, it, vi } from 'vitest'
import { CACHE_KEY, TEAM_CACHE_KEY, loadNotices } from '../../../src/public-notices/load'
import type { PublicNoticesData } from '../../../src/public-notices/types'

const CONFIG = { url: 'https://abc.supabase.co', key: 'sb_publishable_x' }
const DATA: PublicNoticesData = {
  today: '2026-11-05',
  settings: { timeFormat: '12h', currency: 'DOP' },
  notices: [{ id: 'a1', typeId: 'aviso', values: { titulo: 'Hola' }, eventDate: null, updatedAt: '2026-11-04T10:00:00Z' }],
}
const NOW = new Date('2026-11-05T14:15:00Z')

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  }
}
const cached = (data: unknown = DATA, savedAt = '2026-11-04T12:00:00.000Z') => memoryStorage({ [CACHE_KEY]: JSON.stringify({ data, savedAt }) })
const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch
const offline = vi.fn(async () => {
  throw new TypeError('Failed to fetch')
}) as unknown as typeof fetch

describe('loadNotices', () => {
  it('respuesta buena → fresh y la guarda', async () => {
    const fetch = ok(DATA)
    const storage = memoryStorage()
    const state = await loadNotices({ config: CONFIG, fetch, storage, now: () => NOW })
    expect(state).toEqual({ kind: 'fresh', data: DATA, savedAt: NOW.toISOString() })
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!
    expect(url).toBe('https://abc.supabase.co/rest/v1/rpc/public_notices')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('apikey')).toBe('sb_publishable_x')
    expect(JSON.parse(storage.getItem(CACHE_KEY)!)).toEqual({ data: DATA, savedAt: NOW.toISOString() })
  })

  it('sin red con caché → cached', async () => {
    const state = await loadNotices({ config: CONFIG, fetch: offline, storage: cached(), now: () => NOW })
    expect(state).toEqual({ kind: 'cached', data: DATA, savedAt: '2026-11-04T12:00:00.000Z' })
  })

  it('sin red sin caché → offline', async () => {
    expect(await loadNotices({ config: CONFIG, fetch: offline, storage: memoryStorage(), now: () => NOW })).toEqual({ kind: 'offline' })
  })

  it('500 con caché → cached; sin caché → error', async () => {
    const fail = vi.fn(async () => new Response('x', { status: 500 })) as unknown as typeof fetch
    expect((await loadNotices({ config: CONFIG, fetch: fail, storage: cached(), now: () => NOW })).kind).toBe('cached')
    expect(await loadNotices({ config: CONFIG, fetch: fail, storage: memoryStorage(), now: () => NOW })).toEqual({ kind: 'error' })
  })

  it.each([['HTML', '<html>proxy</html>'], ['null', 'null'], ['sin notices', JSON.stringify({ today: '2026-11-05', settings: {} })]])(
    '%s → error y no pisa la caché',
    async (_, body) => {
      const fetch: typeof globalThis.fetch = vi.fn(async () => new Response(body, { status: 200 })) as unknown as typeof fetch
      const storage = cached()
      const before = storage.getItem(CACHE_KEY)
      expect((await loadNotices({ config: CONFIG, fetch, storage, now: () => NOW })).kind).toBe('cached')
      expect(storage.getItem(CACHE_KEY)).toBe(before)
      expect(await loadNotices({ config: CONFIG, fetch, storage: memoryStorage(), now: () => NOW })).toEqual({ kind: 'error' })
    },
  )

  it('sin config → error sin llamar a fetch', async () => {
    const fetch = ok(DATA)
    expect(await loadNotices({ config: null, fetch, storage: memoryStorage(), now: () => NOW })).toEqual({ kind: 'error' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('storage que lanza no rompe', async () => {
    const broken = memoryStorage()
    broken.getItem = () => {
      throw new Error('bloqueado')
    }
    broken.setItem = () => {
      throw new Error('lleno')
    }
    expect((await loadNotices({ config: CONFIG, fetch: ok(DATA), storage: broken, now: () => NOW })).kind).toBe('fresh')
    expect(await loadNotices({ config: CONFIG, fetch: offline, storage: broken, now: () => NOW })).toEqual({ kind: 'offline' })
    expect((await loadNotices({ config: CONFIG, fetch: ok(DATA), storage: null, now: () => NOW })).kind).toBe('fresh')
  })

  it('caché corrupta se ignora', async () => {
    const storage = memoryStorage({ [CACHE_KEY]: '{no es json' })
    expect(await loadNotices({ config: CONFIG, fetch: offline, storage, now: () => NOW })).toEqual({ kind: 'offline' })
    expect(await loadNotices({ config: CONFIG, fetch: offline, storage: cached({ hola: 1 }), now: () => NOW })).toEqual({ kind: 'offline' })
  })

  it('página apagada (enabled false) → disabled y borra la copia guardada', async () => {
    const storage = cached()
    const state = await loadNotices({ config: CONFIG, fetch: ok({ ...DATA, enabled: false, notices: [] }), storage, now: () => NOW })
    expect(state).toEqual({ kind: 'disabled' })
    expect(storage.getItem(CACHE_KEY)).toBeNull()
  })

  it('enabled true se trata como siempre', async () => {
    const state = await loadNotices({ config: CONFIG, fetch: ok({ ...DATA, enabled: true }), storage: memoryStorage(), now: () => NOW })
    expect(state.kind).toBe('fresh')
  })

describe('loadNotices con sesión del equipo', () => {
  const TEAM_DATA: PublicNoticesData = { ...DATA, notices: [{ ...DATA.notices[0]!, values: { titulo: 'Hola', contacto: 'María 809' } }] }

  it('con token pide team_notices con la sesión y guarda aparte', async () => {
    const fetch = ok(TEAM_DATA)
    const storage = memoryStorage()
    const state = await loadNotices({ config: CONFIG, fetch, storage, now: () => NOW, token: 'tok' })
    expect(state).toEqual({ kind: 'fresh', data: TEAM_DATA, savedAt: NOW.toISOString(), team: true })
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!
    expect(url).toBe('https://abc.supabase.co/rest/v1/rpc/team_notices')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok')
    expect(JSON.parse(storage.getItem(TEAM_CACHE_KEY)!).data).toEqual(TEAM_DATA)
    expect(storage.getItem(CACHE_KEY)).toBeNull()
  })

  it('403 (no es del equipo o sesión inválida) → la vista pública', async () => {
    const fetch: typeof globalThis.fetch = vi.fn(async (url: string) =>
      url.endsWith('/team_notices') ? new Response('{}', { status: 403 }) : new Response(JSON.stringify(DATA), { status: 200 }),
    ) as unknown as typeof fetch
    const state = await loadNotices({ config: CONFIG, fetch, storage: memoryStorage(), now: () => NOW, token: 'tok' })
    expect(state).toEqual({ kind: 'fresh', data: DATA, savedAt: NOW.toISOString() })
  })

  it('sin red → la copia del equipo', async () => {
    const storage = memoryStorage({ [TEAM_CACHE_KEY]: JSON.stringify({ data: TEAM_DATA, savedAt: '2026-11-04T12:00:00.000Z' }) })
    const state = await loadNotices({ config: CONFIG, fetch: offline, storage, now: () => NOW, token: 'tok' })
    expect(state).toEqual({ kind: 'cached', data: TEAM_DATA, savedAt: '2026-11-04T12:00:00.000Z', team: true })
  })

  it('sin token nunca lee la copia del equipo', async () => {
    const storage = memoryStorage({ [TEAM_CACHE_KEY]: JSON.stringify({ data: TEAM_DATA, savedAt: '2026-11-04T12:00:00.000Z' }) })
    const state = await loadNotices({ config: CONFIG, fetch: offline, storage, now: () => NOW })
    expect(state).toEqual({ kind: 'offline' })
  })
})
})
