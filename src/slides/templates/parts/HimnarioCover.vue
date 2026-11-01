<script setup lang="ts">
// Himnario: tapa de tela con marco doble de filetes dorados y rombos en las esquinas.
import type { SlidePalette } from '../../themes'
import Texture from './Texture.vue'
import { CLOTH_OPACITY } from './styleParts'

defineProps<{ palette: SlidePalette }>()
const CORNERS = [
  [58, 48],
  [1862, 48],
  [58, 1032],
  [1862, 1032],
] as const
</script>

<template>
  <Texture kind="tela" :ink="palette.text" :opacity="CLOTH_OPACITY" />
  <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
    <rect x="44" y="34" width="1832" height="1012" fill="none" :stroke="palette.accent" stroke-width="4" />
    <rect x="58" y="48" width="1804" height="984" fill="none" :stroke="palette.accent" stroke-width="1.5" />
    <polygon
      v-for="[cx, cy] in CORNERS"
      :key="`${cx}-${cy}`"
      :points="`${cx},${cy - 12} ${cx + 12},${cy} ${cx},${cy + 12} ${cx - 12},${cy}`"
      :fill="palette.accent"
    />
  </svg>
</template>
