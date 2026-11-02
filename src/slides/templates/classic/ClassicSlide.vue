<script setup lang="ts">
// Plantilla Clásica (RF-30, §9): título, la fecha como elemento protagonista, datos y logo.
// Genérica sobre los tipos: lee los datos ya normalizados (RNF-08). Cada estilo (§9) es un componente.
// La Visual con foto tiene su propia composición; sin foto se dibuja como la Clásica.
import { computed, type Component } from 'vue'
import type { SlideContext, SlideSpec } from '../contract'
import AlmanaqueSlide from './AlmanaqueSlide.vue'
import CartelSlide from './CartelSlide.vue'
import HimnarioSlide from './HimnarioSlide.vue'
import type { SlideStyleId } from '../../styles'
import { hasVisualPhoto } from '../visual/layout'
import VisualSlide from '../visual/VisualSlide.vue'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const STYLES: Record<SlideStyleId, Component> = { himnario: HimnarioSlide, almanaque: AlmanaqueSlide, cartel: CartelSlide }
const component = computed(() => (hasVisualPhoto(props.spec) ? VisualSlide : STYLES[props.spec.slideStyle]))
</script>

<template>
  <component :is="component" :spec="spec" :ctx="ctx" />
</template>
