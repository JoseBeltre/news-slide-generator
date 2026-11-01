<script setup lang="ts">
// Cartel: campo de color del tipo en diagonal, una franja fina paralela y entre ambos una trama de
// imprenta. Solo dibuja: los textos del campo los pone la plantilla con data-bg = palette.field.
import { computed } from 'vue'
import { mixColors, type SlidePalette } from '../../themes'
import Texture from './Texture.vue'
import { CARTEL } from './styleParts'

const props = defineProps<{ palette: SlidePalette }>()
const halftoneInk = computed(() => mixColors(props.palette.field, props.palette.background[0]!, 0.15))
</script>

<template>
  <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
    <polygon :points="CARTEL.stripe" :fill="palette.field" />
    <polygon :points="CARTEL.field" :fill="palette.field" />
  </svg>
  <Texture kind="trama" :ink="halftoneInk" :opacity="1" :clip="CARTEL.halftone" />
</template>
