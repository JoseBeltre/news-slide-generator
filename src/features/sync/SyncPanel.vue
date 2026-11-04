<script setup lang="ts">
// Panel del indicador: qué pasa, la última sincronización y la acción que toca (sincronizar o entrar).
import { computed } from 'vue'
import type { SyncState } from '../../data/sync/service'
import type { SyncStatus } from '../../data/sync/status'
import { formatDate, formatTime, toIsoDate } from '../../lib/format'
import UiButton from '../../ui/UiButton.vue'
import { statusDetail } from './syncLabels'

const props = defineProps<{ state: SyncState & { status: Exclude<SyncStatus, 'desactivado'> }; email: string | null }>()
const emit = defineEmits<{ syncNow: []; close: [] }>()

const last = computed(() => {
  if (!props.state.lastSyncAt) return null
  const d = new Date(props.state.lastSyncAt)
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${formatDate(toIsoDate(d))}, ${formatTime(hhmm)}`
})
</script>

<template>
  <div role="dialog" aria-label="Sincronización" class="absolute right-0 top-full z-20 mt-2 w-72 rounded-md border border-hairline bg-surface p-4 shadow-lg">
    <p class="text-sm text-ink">{{ statusDetail(state.status) }}</p>
    <p v-if="last" class="mt-2 font-meta text-meta text-ink-muted">Última vez: {{ last }}</p>
    <p v-if="email" class="mt-1 truncate font-meta text-meta text-ink-muted">{{ email }}</p>
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <template v-if="email">
        <UiButton variant="primary" @click="emit('syncNow')">Sincronizar ahora</UiButton>
        <UiButton variant="ghost" to="/equipo" @click="emit('close')">Equipo</UiButton>
      </template>
      <UiButton v-else variant="primary" to="/entrar" @click="emit('close')">Entrar</UiButton>
    </div>
  </div>
</template>
