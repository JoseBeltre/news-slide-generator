import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
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
        background_color: '#0b1f3a',
        theme_color: '#0b1f3a',
      },
      pwaAssets: { config: true },
      workbox: {
        // Sin 'webmanifest': el plugin ya lo precachea y duplicarlo hace fallar
        // la instalación del Service Worker (add-to-cache-list-conflicting-entries).
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,ico}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
