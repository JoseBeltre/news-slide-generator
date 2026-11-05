<script setup lang="ts">
// Compartir la página pública de anuncios (P9, RF-72), en una línea discreta bajo la tarjeta del sábado:
// no es algo que se toque cada vez que se entra. Solo con la nube activa (sin ella la página no tiene datos)
// y con la página "Para todos".
// "Enlace copiado" sale como aviso (snackbar); si el navegador no deja copiar, el aviso muestra el enlace.
import { ExternalLink, Share2 } from '@lucide/vue'
import { loadSettings } from '../../data/settings'
import { useSync } from '../../data/sync/useSync'
import { useDb, useLiveQuery } from '../../data/useDb'
import { notify } from '../../ui/useSnackbar'

const sync = useSync()
const db = useDb()
// null hasta leer la configuración: con "Solo el equipo" (spec §6.3) no se ofrece compartir.
const publicPage = useLiveQuery(async () => (await loadSettings(db)).publicPage, null)
const url = `${location.origin}/anuncios/publico`

async function share() {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Anuncios · Mansedumbre II', url })
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    notify({ message: 'Enlace copiado', success: true })
  } catch {
    notify({ message: `No se pudo copiar. El enlace es ${url}`, tone: 'warning' })
  }
}

const linkClass =
  'inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[15px] text-ink-muted transition-[color,transform] duration-150 hover:text-ink active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
</script>

<template>
  <div v-if="sync && publicPage === 'todos'" class="mt-1 mb-3 flex flex-wrap items-center gap-x-4 px-0.5">
    <button type="button" :class="[linkClass, 'cursor-pointer']" @click="share">
      <Share2 :size="16" aria-hidden="true" />Compartir los anuncios
    </button>
    <a href="/anuncios/publico" target="_blank" rel="noopener" :class="linkClass"><ExternalLink :size="16" aria-hidden="true" />Ver</a>
  </div>
</template>
