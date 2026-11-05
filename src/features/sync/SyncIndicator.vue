<script setup lang="ts">
// Indicador de sincronización en la barra superior (RF-101): un ícono (con su texto en pantallas anchas).
// Gira mientras sincroniza, pulsa al terminar bien y se sacude en rojo si falla. Al pulsarlo, el panel con
// el detalle. Sin nube configurada no aparece.
import { RefreshCw } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { SyncStatus } from '../../data/sync/status'
import { useSync } from '../../data/sync/useSync'
import SyncPanel from './SyncPanel.vue'
import { STATUS_ICON, statusLabel } from './syncLabels'
import { useSyncFeedback } from './useSyncFeedback'

const sync = useSync()
const open = ref(false)
const { state: raw, justSynced, justFailed } = useSyncFeedback(computed(() => sync.value?.service))

type Visible = Exclude<SyncStatus, 'desactivado'>
const state = computed(() => {
  const s = raw.value
  return s && s.status !== 'desactivado' ? (s as typeof s & { status: Visible }) : null
})
const email = computed(() => sync.value?.auth.session.value?.email ?? null)
const tone = computed(() =>
  state.value?.status === 'nube-no-responde'
    ? 'text-danger'
    : state.value?.status === 'sincronizado'
      ? 'text-ink-muted'
      : state.value?.status === 'pendiente'
        ? 'text-ink'
        : 'text-warning',
)
const label = computed(() => (state.value?.syncing ? 'Sincronizando…' : state.value ? statusLabel(state.value.status, state.value.pending) : ''))

function syncNow() {
  void sync.value?.service.syncNow()
}
</script>

<template>
  <div v-if="state" class="relative" @keydown.escape="open = false">
    <button
      type="button"
      :aria-expanded="open"
      :aria-label="label"
      :title="label"
      :data-sync-status="state.status"
      :data-syncing="state.syncing || undefined"
      :class="['inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-sm px-2 text-sm font-medium whitespace-nowrap transition-[color,transform] duration-150 ease-out hover:text-ink active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink', tone]"
      @click="open = !open"
    >
      <RefreshCw v-if="state.syncing" :size="20" aria-hidden="true" class="motion-safe:animate-spin motion-reduce:animate-fade-pulse" />
      <component
        :is="STATUS_ICON[state.status]"
        v-else
        :size="20"
        aria-hidden="true"
        :class="[justSynced && 'text-success motion-safe:animate-pulse-once', justFailed && 'motion-safe:animate-shake-slow']"
      />
      <span class="sr-only md:not-sr-only">{{ label }}</span>
    </button>
    <SyncPanel v-if="open" :state="state" :email="email" :busy="state.syncing ? 'loading' : justSynced ? 'done' : 'idle'" @sync-now="syncNow" @close="open = false" />
  </div>
</template>
