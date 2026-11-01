<script setup lang="ts">
// Fondo sólido o degradado suave de la paleta. Declara sus paradas en data-bg para auditSlide.
import { computed } from 'vue'

const props = defineProps<{ stops: readonly string[] }>()
const background = computed(() =>
  props.stops.length === 1 ? props.stops[0] : `linear-gradient(135deg, ${props.stops.join(', ')})`,
)
</script>

<template>
  <div :data-bg="stops.join(',')" :style="{ position: 'absolute', inset: 0, background }">
    <slot />
  </div>
</template>
