// Service Worker de la página pública de anuncios (P9, RF-73). Scope: /anuncios/publico.
// - La página: primero la red (siempre lo último) y, sin red, la guardada.
// - /assets/ y fuentes del mismo origen: primero la caché (llevan hash en el nombre).
// - Todo lo demás (la llamada a Supabase incluida) pasa sin tocarlo: los datos se guardan en localStorage.
const CACHE = 'publico-v1'

self.addEventListener('install', () => self.skipWaiting())

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
  if (request.mode === 'navigate' && url.pathname.startsWith('/anuncios/publico')) {
    event.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith('/assets/') || /\.(woff2|svg|ico|png)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request))
  }
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put('/anuncios/publico', response.clone())
    return response
  } catch (error) {
    const cached = await cache.match('/anuncios/publico')
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}
