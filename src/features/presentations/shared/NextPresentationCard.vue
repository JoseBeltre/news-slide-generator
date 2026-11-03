<script setup lang="ts">
// Inicio (§6.1): la presentación del próximo sábado con su conteo y si está lista sin internet;
// si aún no existe, el botón para crearla con los anuncios sugeridos.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { nextSaturday } from '../../../data/presentations'
import { formatDate } from '../../../lib/format'
import UiButton from '../../../ui/UiButton.vue'
import OfflineStatus from './OfflineStatus.vue'
import { useOfflineCheck } from './useOfflineCheck'
import { usePresentationRecord } from './usePresentationRecord'
import { usePresentationSlides } from './usePresentationSlides'
import { usePresentations } from './usePresentations'

const { upcoming, loaded, today, openOrCreate } = usePresentations()
const saturday = nextSaturday(today)
const id = computed(() => upcoming.value.find((p) => p.date === saturday)?.id ?? '')
const { presentation, byId } = usePresentationRecord(id)
const { ctx, count } = usePresentationSlides(presentation, byId)
const { report, checking } = useOfflineCheck(
  computed(() => (presentation.value ? { presentation: presentation.value, byId: byId.value, ctx: ctx.value } : undefined)),
)
</script>

<template>
  <section v-if="loaded" aria-label="Presentación del sábado" class="mb-8 flex flex-col gap-3 rounded-md border border-hairline bg-surface p-4">
    <template v-if="presentation">
      <RouterLink :to="{ name: 'presentacion', params: { id: presentation.id } }" class="flex flex-wrap items-baseline gap-x-3 hover:underline">
        <span class="font-display text-heading-sm text-ink">{{ formatDate(presentation.date) }}</span>
        <span class="font-meta text-meta uppercase text-ink-muted">{{ count }}</span>
      </RouterLink>
      <OfflineStatus :report="report" :checking="checking" compact />
    </template>
    <div v-else class="flex flex-wrap items-center justify-between gap-3">
      <span class="text-ink">Aún no hay presentación para el {{ formatDate(saturday).toLowerCase() }}.</span>
      <UiButton @click="openOrCreate(saturday)">Crear la presentación del sábado</UiButton>
    </div>
  </section>
</template>
