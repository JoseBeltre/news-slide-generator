<script setup lang="ts">
// Página pública de anuncios (P9, RF-70…73): lo vigente para la congregación, en texto. Sigue el tema del
// sistema (sin el selector de la app). Sin red muestra lo guardado en este celular, con su fecha.
import { computed, onMounted, shallowRef } from 'vue'
import { supabaseConfig } from '../data/sync/supabase'
import { noticeCards, stateLabel } from './cards'
import { loadNotices } from './load'
import NoticeCardView from './NoticeCardView.vue'
import type { LoadState } from './types'

/** `load` solo en pruebas; en la página real se pide a Supabase. */
const props = defineProps<{ load?: () => Promise<LoadState> }>()

const state = shallowRef<LoadState | null>(null)
const cards = computed(() => (state.value && 'data' in state.value ? noticeCards(state.value.data) : []))
const label = computed(() => (state.value ? stateLabel(state.value) : null))
const message = computed(() => {
  if (state.value?.kind === 'offline') return 'Ábrela una vez con internet para guardarla en este celular.'
  if (state.value?.kind === 'error') return 'No se pudieron cargar los anuncios. Prueba más tarde.'
  return 'No hay anuncios por ahora.'
})

function safeStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

onMounted(async () => {
  const load =
    props.load ?? (() => loadNotices({ config: supabaseConfig(), fetch: (...a) => fetch(...a), storage: safeStorage(), now: () => new Date() }))
  try {
    state.value = await load()
  } catch {
    state.value = { kind: 'error' }
  }
})
</script>

<template>
  <main class="mx-auto w-full max-w-xl px-4 pt-6 pb-12">
    <header>
      <p class="font-meta text-meta uppercase text-ink-muted">Mansedumbre II · IASD</p>
      <h1 class="mt-1 font-display text-display-sm text-ink">Anuncios</h1>
      <p v-if="label" class="mt-1 text-sm text-ink-muted">{{ label }}</p>
    </header>
    <div v-if="!state" aria-busy="true" aria-label="Cargando los anuncios" class="mt-4 flex flex-col gap-3">
      <div v-for="n in 3" :key="n" class="h-28 animate-pulse rounded-xl border border-hairline bg-surface" />
    </div>
    <ol v-else-if="cards.length" class="mt-4 flex flex-col gap-3">
      <NoticeCardView v-for="card in cards" :key="card.id" :card="card" />
    </ol>
    <p v-else class="mt-6 text-base text-ink-muted">{{ message }}</p>
  </main>
</template>
