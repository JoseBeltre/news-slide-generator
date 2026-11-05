<script setup lang="ts">
// Compartir la página pública de anuncios (P9, RF-72), en una línea discreta bajo la tarjeta del sábado:
// no es algo que se toque cada vez que se entra. Solo con la nube activa (sin ella la página no tiene datos)
// y con la página "Para todos".
// "Enlace copiado" va en la misma línea por ahora; un snackbar queda para la tarea de diseño móvil.
import { ExternalLink, Share2 } from '@lucide/vue'
import { ref } from 'vue'
import { loadSettings } from '../../data/settings'
import { useSync } from '../../data/sync/useSync'
import { useDb, useLiveQuery } from '../../data/useDb'

const sync = useSync()
const db = useDb()
// null hasta leer la configuración: con "Solo el equipo" (spec §6.3) no se ofrece compartir.
const publicPage = useLiveQuery(async () => (await loadSettings(db)).publicPage, null)
const url = `${location.origin}/anuncios/publico`
const status = ref<'copied' | 'manual' | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

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
    status.value = 'copied'
    clearTimeout(timer)
    timer = setTimeout(() => (status.value = null), 2000)
  } catch {
    status.value = 'manual'
  }
}

const linkClass =
  'inline-flex min-h-9 items-center gap-1.5 rounded-sm text-[13px] text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
</script>

<template>
  <div v-if="sync && publicPage === 'todos'" class="mt-1 mb-3 flex flex-wrap items-center gap-x-4 px-0.5">
    <button type="button" :class="[linkClass, 'cursor-pointer']" @click="share">
      <Share2 :size="14" aria-hidden="true" />Compartir los anuncios
    </button>
    <a href="/anuncios/publico" target="_blank" rel="noopener" :class="linkClass"><ExternalLink :size="14" aria-hidden="true" />Ver</a>
    <p role="status" class="text-[13px] text-ink-muted">
      <template v-if="status === 'copied'">Enlace copiado</template>
      <span v-else-if="status === 'manual'" class="select-all text-ink">{{ url }}</span>
    </p>
  </div>
</template>
