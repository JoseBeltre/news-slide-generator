<script setup lang="ts">
// Indicador de sincronización en el encabezado (RF-101): un texto corto con su icono. Al pulsarlo,
// el panel con el detalle. Sin nube configurada no aparece.
import { computed, ref } from 'vue'
import type { SyncStatus } from '../../data/sync/status'
import SyncPanel from './SyncPanel.vue'
import { STATUS_ICON, statusLabel } from './syncLabels'
import { useSync } from '../../data/sync/useSync'

const sync = useSync()
const open = ref(false)

type Visible = Exclude<SyncStatus, 'desactivado'>
const state = computed(() => {
  const s = sync.value?.service.state.value
  return s && s.status !== 'desactivado' ? (s as typeof s & { status: Visible }) : null
})
const email = computed(() => sync.value?.auth.session.value?.email ?? null)
const tone = computed(() =>
  state.value?.status === 'sincronizado' ? 'text-ink-muted' : state.value?.status === 'pendiente' ? 'text-ink' : 'text-warning',
)

function syncNow() {
  void sync.value?.service.syncNow()
}
</script>

<template>
  <div v-if="state" class="relative" @keydown.escape="open = false">
    <button
      type="button"
      :aria-expanded="open"
      :class="['inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm font-medium whitespace-nowrap hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink', tone]"
      @click="open = !open"
    >
      <component :is="STATUS_ICON[state.status]" :size="18" aria-hidden="true" />{{ statusLabel(state.status, state.pending) }}
    </button>
    <SyncPanel v-if="open" :state="state" :email="email" @sync-now="syncNow" @close="open = false" />
  </div>
</template>
