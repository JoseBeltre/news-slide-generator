<script setup lang="ts">
// Plantilla Visual (RF-30, §5.5, §9): afiche con la foto recortada de quien predica o del invitado
// especial, en el estilo elegido. Solo se dibuja con foto; sin ella, la Visual es la Clásica.
import { computed, type Component } from 'vue'
import type { SlideStyleId } from '../../styles'
import type { SlideContext, SlideSpec } from '../contract'
import VisualAlmanaque from './VisualAlmanaque.vue'
import VisualCartel from './VisualCartel.vue'
import VisualHimnario from './VisualHimnario.vue'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const STYLES: Record<SlideStyleId, Component> = { himnario: VisualHimnario, almanaque: VisualAlmanaque, cartel: VisualCartel }
const component = computed(() => STYLES[props.spec.slideStyle])
</script>

<template>
  <component :is="component" :spec="spec" :ctx="ctx" />
</template>
