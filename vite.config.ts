import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      // 'prompt': una versión nueva nunca recarga la página en medio de una presentación;
      // se aplica al volver a abrir la app.
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'Anuncios del Sábado',
        short_name: 'Anuncios',
        lang: 'es-DO',
        display: 'standalone',
        // Colores de la interfaz (DESIGN.md): crema y tinta.
        background_color: '#F3F0D6',
        theme_color: '#1A1A1A',
      },
      pwaAssets: { config: true },
      workbox: {
        // Sin 'webmanifest': el plugin ya lo precachea y duplicarlo hace fallar
        // la instalación del Service Worker (add-to-cache-list-conflicting-entries).
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,ico}'],
        navigateFallback: 'index.html',
        // La primera visita queda controlada sin recargar. Una versión nueva sigue esperando
        // (sin skipWaiting), así que no cambia nada en medio de una presentación.
        clientsClaim: true,
      },
    }),
  ],
})
