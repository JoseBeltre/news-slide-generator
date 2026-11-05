// Service Worker de la página pública (P9, RF-73), cargado en un entorno de SW falso: al instalarse guarda
// la página y sus archivos (la primera visita ya sirve sin internet); con red lenta o un 5xx sirve la copia;
// nunca guarda un HTML de fallback bajo una URL de /assets/.
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGIN = 'https://anunciosm2.jose-web.com'
const source = readFileSync(new URL('../../public/publico-sw.js', import.meta.url), 'utf8')
const PAGE_HTML = '<html><script type="module" src="/assets/publico-abc.js"></script><link rel="stylesheet" href="/assets/normalize-def.css"></html>'
const CSS = '@font-face{src:url(/assets/inter-123.woff2) format("woff2")}'

type Handler = (event: unknown) => void
interface FakeRequest {
  url: string
  method: string
  mode: string
}

function load(fetchImpl: (url: string) => Promise<Response>) {
  const handlers: Record<string, Handler> = {}
  const store = new Map<string, Response>()
  const key = (k: string | FakeRequest) => new URL(typeof k === 'string' ? k : k.url, ORIGIN).href
  const cache = {
    put: async (k: string | FakeRequest, r: Response) => void store.set(key(k), r),
    // Como la Cache API: una respuesta con Vary no coincide con otra petición salvo con ignoreVary.
    match: async (k: string | FakeRequest, opts?: { ignoreVary?: boolean }) => {
      const hit = store.get(key(k))
      return hit && (opts?.ignoreVary || !hit.headers.has('vary')) ? hit.clone() : undefined
    },
  }
  const fetch = vi.fn(async (input: string | FakeRequest) => fetchImpl(key(input)))
  const self = {
    addEventListener: (type: string, fn: Handler) => void (handlers[type] = fn),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
    location: { origin: ORIGIN },
  }
  runInNewContext(source, { self, caches: { open: async () => cache, keys: async () => [], delete: async () => true }, fetch, URL, Response, setTimeout, clearTimeout, Promise, Set })
  return {
    store,
    fetch,
    async install() {
      const waits: Promise<unknown>[] = []
      handlers.install!({ waitUntil: (p: Promise<unknown>) => waits.push(p) })
      await Promise.all(waits)
    },
    navigate(path = '/anuncios/publico') {
      let response: Promise<Response> | undefined
      handlers.fetch!({ request: { url: ORIGIN + path, method: 'GET', mode: 'navigate' }, respondWith: (p: Promise<Response>) => (response = p) })
      return response!
    },
    get(path: string) {
      let response: Promise<Response> | undefined
      handlers.fetch!({ request: { url: ORIGIN + path, method: 'GET', mode: 'cors' }, respondWith: (p: Promise<Response>) => (response = p) })
      return response!
    },
  }
}

const html = (body: string, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/html' } })
// `Vary: Origin` como el servidor real: los scripts de módulo se piden con Origin y lo guardado al instalar, sin él.
const asset = (body: string) => new Response(body, { status: 200, headers: { 'content-type': 'text/javascript', vary: 'Origin' } })

function site(url: string): Promise<Response> {
  const path = new URL(url).pathname
  if (path === '/anuncios/publico') return Promise.resolve(html(PAGE_HTML))
  if (path.endsWith('.css')) return Promise.resolve(new Response(CSS, { headers: { 'content-type': 'text/css' } }))
  return Promise.resolve(asset(`// ${path}`))
}
const offline = () => Promise.reject(new TypeError('Failed to fetch'))

afterEach(() => vi.useRealTimers())

describe('publico-sw.js', () => {
  it('al instalarse guarda la página, su JS, su CSS y las fuentes del CSS', async () => {
    const sw = load(site)
    await sw.install()
    expect([...sw.store.keys()].sort()).toEqual(
      [
        `${ORIGIN}/anuncios/publico`,
        `${ORIGIN}/assets/inter-123.woff2`,
        `${ORIGIN}/assets/normalize-def.css`,
        `${ORIGIN}/assets/publico-abc.js`,
      ].sort(),
    )
  })

  it('tras la primera visita abre sin internet', async () => {
    let fetchImpl = site
    const sw = load((u) => fetchImpl(u))
    await sw.install()
    fetchImpl = offline
    expect(await (await sw.navigate()).text()).toBe(PAGE_HTML)
    expect(await (await sw.get('/assets/publico-abc.js')).text()).toBe('// /assets/publico-abc.js')
  })

  it('con red colgada sirve la copia a los 4 segundos', async () => {
    let fetchImpl = site
    const sw = load((u) => fetchImpl(u))
    await sw.install()
    vi.useFakeTimers()
    fetchImpl = () => new Promise<Response>(() => {})
    const response = sw.navigate()
    await vi.advanceTimersByTimeAsync(4000)
    expect(await (await response).text()).toBe(PAGE_HTML)
  })

  it('un 503 con copia guardada sirve la copia', async () => {
    let fetchImpl = site
    const sw = load((u) => fetchImpl(u))
    await sw.install()
    fetchImpl = () => Promise.resolve(html('caído', 503))
    const response = await sw.navigate()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(PAGE_HTML)
  })

  it('no guarda un HTML de fallback bajo una URL de /assets/', async () => {
    const sw = load((u) => (u.endsWith('/assets/viejo-1.js') ? Promise.resolve(html('<html>index</html>')) : site(u)))
    await sw.get('/assets/viejo-1.js')
    expect(sw.store.has(`${ORIGIN}/assets/viejo-1.js`)).toBe(false)
  })
})
