// Entrada de la página pública (publico.html, P9): un mini programa aparte de la app del equipo, sin la
// base local, el router ni Supabase. Sigue el tema del sistema. Su Service Worker solo cubre /anuncios/publico.
import { createApp } from 'vue'
import '../ui/styles.css'
import '../ui/fonts'
import PublicNoticesApp from './PublicNoticesApp.vue'

createApp(PublicNoticesApp).mount('#app')

if (import.meta.env.PROD && location.pathname.startsWith('/anuncios/publico')) {
  navigator.serviceWorker?.register('/publico-sw.js', { scope: '/anuncios/publico' }).catch(() => {
    // Sin Service Worker la página funciona igual; solo no abre sin internet.
  })
}
