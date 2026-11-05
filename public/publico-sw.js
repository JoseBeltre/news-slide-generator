// Service Worker de la página pública de anuncios (P9, RF-73). Scope: /anuncios/publico.
// - Al instalarse guarda la página y lo que usa (su JS, su CSS y las fuentes del CSS): la primera visita
//   ya deja todo listo para abrirla sin internet, sin tener que volver a entrar.
// - La página: primero la red, con 4 s de espera si ya hay copia; sin red, lenta o con error, la copia.
// - /assets/ y los íconos del mismo origen: primero la caché, sin mirar Vary (el servidor manda
//   `Vary: Origin` y los scripts de módulo se piden con Origin). Nunca se guarda un HTML bajo /assets/
//   (el servidor responde index.html a un archivo que ya no existe).
// - Todo lo demás (la llamada a Supabase incluida) pasa sin tocarlo: los datos van en localStorage.
const CACHE = 'publico-v1'
const PAGE = '/anuncios/publico'
const NETWORK_TIMEOUT_MS = 4000
const ASSET_URL = /\/assets\/[^"'\s)]+/g

self.addEventListener('install', (event) => {
  event.waitUntil(
    precache()
      .catch(() => {
        // Sin red al instalarse: se guardará en la próxima visita.
      })
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith('publico-') && key !== CACHE) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate' && url.pathname.startsWith(PAGE)) {
    event.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith('/assets/') || /\.(woff2|svg|ico|png)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request))
  }
})

const isHtml = (response) => (response.headers.get('content-type') ?? '').startsWith('text/html')

async function precache() {
  const cache = await caches.open(CACHE)
  const page = await fetch(PAGE)
  if (!page.ok) return
  const queue = [...new Set((await page.clone().text()).match(ASSET_URL) ?? [])]
  await cache.put(PAGE, page)
  const seen = new Set(queue)
  while (queue.length) {
    const url = queue.shift()
    const response = await fetch(url)
    if (!response.ok || isHtml(response)) continue
    if (url.endsWith('.css')) {
      for (const inner of (await response.clone().text()).match(ASSET_URL) ?? []) {
        if (!seen.has(inner)) seen.add(inner) && queue.push(inner)
      }
    }
    await cache.put(url, response)
  }
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => (clearTimeout(timer), resolve(value)),
      (error) => (clearTimeout(timer), reject(error)),
    )
  })
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(PAGE, { ignoreVary: true })
  try {
    const pending = fetch(request)
    const response = await (cached ? withTimeout(pending, NETWORK_TIMEOUT_MS) : pending)
    if (response.ok) {
      await cache.put(PAGE, response.clone())
      return response
    }
    return cached ?? response
  } catch (error) {
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request, { ignoreVary: true })
  if (cached) return cached
  const response = await fetch(request)
  const isAsset = new URL(request.url).pathname.startsWith('/assets/')
  if (response.ok && !(isAsset && isHtml(response))) await cache.put(request, response.clone())
  return response
}
