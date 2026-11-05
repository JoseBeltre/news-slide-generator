<script setup lang="ts">
// La presentación del archivo: su fecha, si ya está en este equipo y, si la fecha tiene otra
// presentación, el campo para elegir otra (no se puede importar hasta que esté libre).
import type { PlannedPresentation, Resolution } from '../../../data/transfer/plan'
import { formatDate } from '../../../lib/format'
import UiBadge from '../../../ui/UiBadge.vue'
import UiBanner from '../../../ui/UiBanner.vue'
import UiField from '../../../ui/UiField.vue'
import UiInput from '../../../ui/UiInput.vue'
import ResolutionChoice from './ResolutionChoice.vue'

defineProps<{ presentation: PlannedPresentation; conflict: boolean }>()
const emit = defineEmits<{ resolution: [value: Resolution]; targetDate: [value: string] }>()
</script>

<template>
  <div class="flex flex-col gap-3 rounded-md border border-hairline bg-surface p-4">
    <div class="flex flex-wrap items-center gap-3">
      <h2 class="font-display text-heading-sm text-ink">Presentación del {{ formatDate(presentation.date) }}</h2>
      <UiBadge v-if="presentation.exists">Ya está en este equipo</UiBadge>
    </div>
    <ResolutionChoice
      v-if="presentation.exists"
      :model-value="presentation.resolution"
      label="Cómo importar la presentación"
      @update:model-value="emit('resolution', $event)"
    />
    <template v-if="conflict">
      <UiBanner>Ya hay una presentación el {{ formatDate(presentation.targetDate) }}. Elige otra fecha.</UiBanner>
      <UiField id="importar-fecha" label="Otra fecha">
        <UiInput id="importar-fecha" type="date" class="max-w-xs" :model-value="presentation.targetDate" @update:model-value="(v) => v && emit('targetDate', v)" />
      </UiField>
    </template>
  </div>
</template>
