<script setup lang="ts">
// Un anuncio del archivo: casilla (solo en una presentación), título y tipo, y si ya está en este
// equipo, la elección de importarlo como copia o sobrescribirlo.
import { computed } from 'vue'
import type { PlannedAnnouncement, Resolution } from '../../../data/transfer/plan'
import UiBadge from '../../../ui/UiBadge.vue'
import UiCheckbox from '../../../ui/UiCheckbox.vue'
import { typeVisual } from '../../announcements/shared/typeVisual'
import ResolutionChoice from './ResolutionChoice.vue'

const props = defineProps<{ item: PlannedAnnouncement; selectable: boolean }>()
const emit = defineEmits<{ toggle: []; resolution: [value: Resolution] }>()
const name = computed(() => props.item.title ?? 'Sin título')
</script>

<template>
  <li data-import-item class="flex flex-col gap-3 border-b border-hairline py-4">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <UiCheckbox v-if="selectable" :model-value="item.included" @update:model-value="emit('toggle')">
        <span class="font-medium">{{ name }}</span>
      </UiCheckbox>
      <span v-else class="font-medium text-ink">{{ name }}</span>
      <span class="text-sm text-ink-muted">{{ typeVisual(item.typeId).name }}</span>
      <UiBadge v-if="item.exists">Ya está en este equipo</UiBadge>
    </div>
    <ResolutionChoice
      v-if="item.exists && item.included"
      :model-value="item.resolution"
      :label="`Cómo importar «${name}»`"
      @update:model-value="emit('resolution', $event)"
    />
  </li>
</template>
