<script setup lang="ts">
// Almanaque: la hoja del día sobre el bloc (dos hojas giradas debajo), con la costura y las grapas
// de la cabecera y, si hay talón, la línea de picado con sus muescas. Solo dibuja: los textos
// encima los pone la plantilla con data-bg = palette.field.
import { computed } from 'vue'
import { mixColors, type SlidePalette } from '../../themes'
import { sheetSeam, type SheetGeometry } from './styleParts'

const props = defineProps<{ palette: SlidePalette; sheet: SheetGeometry; perforationY?: number }>()

const ground = computed(() => props.palette.background[0]!)
const seam = computed(() => sheetSeam(props.palette))
const under = computed(() => [
  { rotate: -3.2, fill: mixColors(props.palette.field, ground.value, 0.62) },
  { rotate: 1.8, fill: mixColors(props.palette.field, ground.value, 0.36) },
])
const rect = computed(() => ({
  position: 'absolute' as const,
  left: `${props.sheet.x}px`,
  top: `${props.sheet.y}px`,
  width: `${props.sheet.width}px`,
  height: `${props.sheet.height}px`,
  borderRadius: '10px',
}))
</script>

<template>
  <div v-for="u in under" :key="u.rotate" aria-hidden="true" :style="{ ...rect, background: u.fill, transform: `rotate(${u.rotate}deg)`, transformOrigin: '50% 0' }" />
  <div aria-hidden="true" :style="{ ...rect, background: palette.field, boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)' }" />
  <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
    <path :d="`M${sheet.x} ${sheet.headerBottom}H${sheet.x + sheet.width}`" :stroke="seam" stroke-width="3" />
    <rect v-for="x in [sheet.x + 140, sheet.x + sheet.width - 164]" :key="x" :x="x" :y="sheet.headerBottom - 7" width="24" height="14" rx="3" :fill="seam" />
    <template v-if="perforationY !== undefined">
      <path :d="`M${sheet.x + 22} ${perforationY}H${sheet.x + sheet.width - 22}`" :stroke="seam" stroke-width="4" stroke-dasharray="4 14" stroke-linecap="round" />
      <circle v-for="x in [sheet.x, sheet.x + sheet.width]" :key="x" :cx="x" :cy="perforationY" r="16" :fill="ground" />
    </template>
  </svg>
</template>
