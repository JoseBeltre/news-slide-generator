<script setup lang="ts">
// Emblema del tipo de anuncio (§9): su ícono en grande, como sello. Es decoración (no lleva data-icon):
// el dato ya está en el texto.
import { computed } from 'vue'
import type { Rect } from '../../engine'
import { iconFor } from '../../icons'
import { getTypeDef } from '../../types/definitions'
import type { AnnouncementTypeId } from '../../types/fields'

const props = defineProps<{ typeId: AnnouncementTypeId; box: Rect; color: string; strokeWidth?: number }>()
const icon = computed(() => iconFor(getTypeDef(props.typeId).icon))
</script>

<template>
  <div
    v-if="icon"
    aria-hidden="true"
    data-emblem
    :style="{
      position: 'absolute',
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color,
    }"
  >
    <component :is="icon" :size="Math.min(box.width, box.height)" :stroke-width="strokeWidth ?? 1.5" />
  </div>
</template>
