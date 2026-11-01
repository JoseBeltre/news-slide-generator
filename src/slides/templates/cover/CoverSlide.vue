<script setup lang="ts">
// Portada y cierre (§9): logo de la iglesia grande, título y fecha de la presentación, en el estilo elegido.
import { computed, type Component } from 'vue'
import type { SlideStyleId } from '../../styles'
import type { SlideContext, SlideSpec } from '../contract'
import CoverAlmanaque from './CoverAlmanaque.vue'
import CoverCartel from './CoverCartel.vue'
import CoverHimnario from './CoverHimnario.vue'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'cover' | 'closing' }>; ctx: SlideContext }>()

const STYLES: Record<SlideStyleId, Component> = { himnario: CoverHimnario, almanaque: CoverAlmanaque, cartel: CoverCartel }
const component = computed(() => STYLES[props.spec.slideStyle])
</script>

<template>
  <component :is="component" :spec="spec" :ctx="ctx" />
</template>
