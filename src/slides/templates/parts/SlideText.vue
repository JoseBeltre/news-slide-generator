<script setup lang="ts">
// Texto de plantilla: FitText que informa su ajuste a la SlideView (§5.6).
import { FitText, type TextSlotDef } from '../../engine'
import { useFitReporter } from '../fitCollector'

defineProps<{ slot: TextSlotDef; text: string; fontFamily?: string }>()
const report = useFitReporter()
</script>

<template>
  <FitText :slot="slot" :text="text" :font-family="fontFamily" @fit="report" />
</template>
