<script setup lang="ts">
// Cumpleaños individual (RF-22, RF-23): una persona por slide, en el estilo elegido (§9).
import { computed, type Component } from 'vue'
import type { SlideStyleId } from '../../styles'
import type { SlideContext, SlideSpec } from '../contract'
import SingleAlmanaque from './SingleAlmanaque.vue'
import SingleCartel from './SingleCartel.vue'
import SingleHimnario from './SingleHimnario.vue'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'birthday-single' }>; ctx: SlideContext }>()

const STYLES: Record<SlideStyleId, Component> = { himnario: SingleHimnario, almanaque: SingleAlmanaque, cartel: SingleCartel }
const component = computed(() => STYLES[props.spec.slideStyle])
</script>

<template>
  <component :is="component" :spec="spec" :ctx="ctx" />
</template>
