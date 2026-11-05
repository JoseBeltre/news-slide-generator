<script setup lang="ts">
// Página pública de anuncios (P9, RF-70…73): lo vigente para la congregación, en texto. Sigue el tema del
// sistema (sin el selector de la app). Sin red muestra lo guardado en este celular, con su fecha.
// Movimiento: tarjetas escalonadas (60 ms), el «Actualizado» pulsa una vez con datos nuevos y el aviso de
// sin conexión baja desde arriba.
import { computed } from 'vue'
import { WifiOff } from '@lucide/vue'
import { supabaseConfig } from '../data/sync/supabase'
import { noticeCards, stateLabel } from './cards'
import { loadNotices } from './load'
import NoticeCardView from './NoticeCardView.vue'
import { teamToken } from './session'
import TeamBanner from './TeamBanner.vue'
import type { LoadState } from './types'
import { useNotices } from './useNotices'

/** `load` solo en pruebas; en la página real se pide a Supabase. */
const props = defineProps<{ load?: () => Promise<LoadState> }>()

function safeStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const { state, pulse } = useNotices(
  props.load ??
    (() => {
      const config = supabaseConfig()
      const storage = safeStorage()
      const token = config ? teamToken(storage, config.url, Date.now()) : null
      return loadNotices({ config, fetch: (...a) => fetch(...a), storage, now: () => new Date(), token })
    }),
)
const team = computed(() => !!state.value && 'team' in state.value && !!state.value.team)
const cards = computed(() => (state.value && 'data' in state.value ? noticeCards(state.value.data, { team: team.value }) : []))
const label = computed(() => (state.value ? stateLabel(state.value) : null))
const offline = computed(() => state.value?.kind === 'cached')
const message = computed(() => {
  if (state.value?.kind === 'offline') return 'Ábrela una vez con internet para guardarla en este celular.'
  if (state.value?.kind === 'disabled') return 'Los anuncios no están disponibles por ahora.'
  if (state.value?.kind === 'error') return 'No se pudieron cargar los anuncios. Prueba más tarde.'
  return 'No hay anuncios por ahora.'
})
</script>

<template>
  <!-- Aviso de sin conexión: baja desde arriba y se queda mientras se muestra la copia guardada. -->
  <Transition
    enter-active-class="transition duration-250 ease-out"
    leave-active-class="transition duration-180 ease-in"
    enter-from-class="-translate-y-full opacity-0 motion-reduce:translate-y-0"
    leave-to-class="-translate-y-full opacity-0 motion-reduce:translate-y-0"
  >
    <p v-if="offline" role="status" class="sticky top-0 z-30 flex items-center gap-2.5 border-b border-warning bg-warning-bg px-4 py-3 text-[15px] font-medium text-warning">
      <WifiOff :size="20" aria-hidden="true" class="shrink-0" />{{ label }}
    </p>
  </Transition>
  <main class="mx-auto w-full max-w-xl px-4 pt-6 pb-12">
    <header>
      <p class="font-meta text-meta uppercase text-ink-muted">Mansedumbre II · IASD</p>
      <h1 class="mt-1 font-display text-lg text-ink">Anuncios</h1>
      <p
        v-if="label && !offline"
        :class="['relative mt-2 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 text-sm text-ink-muted', pulse && 'motion-safe:animate-pulse-card motion-reduce:animate-fade-in']"
      >
        <span aria-hidden="true" class="size-2 rounded-full bg-success" />{{ label }}
        <span v-if="pulse" aria-hidden="true" class="pointer-events-none absolute -inset-px rounded-full border-2 border-success opacity-0 motion-safe:animate-ring" />
      </p>
      <TeamBanner v-if="team" />
    </header>
    <div v-if="!state" aria-busy="true" aria-label="Cargando los anuncios" class="mt-4 flex flex-col gap-3">
      <div v-for="n in 3" :key="n" class="h-28 motion-safe:animate-pulse rounded-xl border border-hairline bg-surface" />
    </div>
    <ol v-else-if="cards.length" class="mt-4 flex flex-col gap-3">
      <NoticeCardView v-for="(card, i) in cards" :key="card.id" :card="card" :style="{ animationDelay: `${i * 60}ms` }" class="motion-safe:animate-card-in motion-reduce:animate-fade-in" />
    </ol>
    <p v-else class="mt-6 text-base text-ink-muted">{{ message }}</p>
  </main>
</template>
