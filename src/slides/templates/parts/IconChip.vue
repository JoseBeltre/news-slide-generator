<script setup lang="ts">
// Ícono de un dato (§5.4): SVG local de 64 px sobre un chip del color de acento.
import { computed } from 'vue'
import { ICON_MIN_PX, type Rect } from '../../engine'
import { iconFor } from '../../icons'

const props = defineProps<{ name?: string; box: Rect; background: string; color: string; radius: string; size?: number }>()
const icon = computed(() => iconFor(props.name))
</script>

<template>
  <div
    v-if="icon"
    :style="{
      position: 'absolute',
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
      borderRadius: radius,
      background,
      color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }"
  >
    <component :is="icon" data-icon :size="size ?? ICON_MIN_PX" :stroke-width="2.25" aria-hidden="true" />
  </div>
</template>
