<script setup lang="ts">
// Ornamento tipográfico de imprenta (filete con rombo central). Pura decoración.
import type { Rect } from '../../engine'

defineProps<{ box: Rect; color: string }>()
</script>

<template>
  <svg
    aria-hidden="true"
    viewBox="0 0 240 40"
    :width="box.width"
    :height="box.height"
    :style="{ position: 'absolute', left: `${box.x}px`, top: `${box.y}px` }"
  >
    <polygon points="0,20 92,17 100,20 92,23" :fill="color" />
    <polygon points="240,20 148,17 140,20 148,23" :fill="color" />
    <polygon points="120,4 136,20 120,36 104,20" :fill="color" />
  </svg>
</template>
