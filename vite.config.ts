import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// /anuncios/publico es la página pública (publico.html, P9). En Hostinger la sirve el .htaccess;
// en `pnpm dev` y `pnpm preview`, este plugin. Además le quita el manifiesto de la app: no se instala.
const PUBLIC_PATH = /^\/anuncios\/publico\/?(\?.*)?$/
function publicNoticesPage(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url && PUBLIC_PATH.test(req.url)) req.url = '/publico.html'
    next()
  }
  return {
    name: 'anuncios-publicos',
    // Después de vite-plugin-pwa, que inyecta el manifiesto en todas las páginas.
    enforce: 'post',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
    transformIndexHtml: {
      order: 'post',
      handler: (html, ctx) => (ctx.path.endsWith('/publico.html') ? html.replace(/\s*<link rel="manifest"[^>]*>/g, '') : html),
    },
  }
}

export default defineConfig({
  base: '/',
  // Dos páginas: la app del equipo y la página pública de anuncios (P9), con su propio bundle.
  build: { rollupOptions: { input: { main: 'index.html', publico: 'publico.html' } } },
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      // 'prompt': una versión nueva nunca recarga la página en medio de una presentación;
      // se aplica al volver a abrir la app.
      registerType: 'prompt',
      // Se registra en src/main.ts: así la página pública (publico.html) nunca instala la app.
      injectRegister: false,
      manifest: {
        id: '/',
        start_url: '/',
        name: 'Anuncios del Sábado · Mansedumbre II',
        short_name: 'Anuncios',
        description:
          'Prepara los anuncios del sábado de la Iglesia Adventista Mansedumbre II y preséntalos en las pantallas, también sin internet.',
        lang: 'es-DO',
        dir: 'ltr',
        display: 'standalone',
        categories: ['productivity'],
        // Colores de la interfaz (DESIGN.md): crema y tinta.
        background_color: '#F3F0D6',
        theme_color: '#1A1A1A',
        // Los genera `pnpm marca`: sin fondo para el escritorio y la pestaña; con fondo tinta para el
        // móvil, que recorta el icono (maskable).
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Nuevo anuncio', url: '/anuncios/nuevo', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Presentaciones', url: '/presentaciones', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // Sin 'webmanifest': el plugin ya lo precachea y duplicarlo hace fallar
        // la instalación del Service Worker (add-to-cache-list-conflicting-entries).
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,ico}'],
        navigateFallback: 'index.html',
        // La página pública tiene su propio Service Worker (public/publico-sw.js).
        navigateFallbackDenylist: [/^\/anuncios\/publico/, /^\/publico\.html/],
        // La primera visita queda controlada sin recargar. Una versión nueva sigue esperando
        // (sin skipWaiting), así que no cambia nada en medio de una presentación.
        clientsClaim: true,
      },
    }),
    publicNoticesPage(),
  ],
})
