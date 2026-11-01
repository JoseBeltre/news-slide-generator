// Galería de desarrollo: solo existe con `pnpm dev` (Vite construye únicamente index.html).
import { createApp } from 'vue'
import '../slides/fonts'
import Gallery from './Gallery.vue'

createApp(Gallery).mount('#galeria')
