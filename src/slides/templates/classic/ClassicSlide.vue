<script setup lang="ts">
// Plantilla Clásica (RF-30, §9): fondo sólido o degradado, título arriba, datos con ícono en columna
// y el logo (si lo hay) en la esquina. Genérica sobre los tipos: lee las filas ya normalizadas.
import { computed } from 'vue'
import { logoCandidatesFor } from '../../../data/ministries'
import type { SlideContext, SlideSpec } from '../contract'
import { CHIP_RADIUS, DEFAULT_DECORATION } from '../parts/decoration'
import EdgeDecoration from '../parts/EdgeDecoration.vue'
import IconChip from '../parts/IconChip.vue'
import LogoSlot from '../parts/LogoSlot.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import { classicLayout } from './layout'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const variant = computed(() => props.spec.decoration ?? DEFAULT_DECORATION)
const palette = computed(() => props.spec.palette)
const hasLogo = computed(() => logoCandidatesFor(props.spec.logo, props.ctx.ministries).length > 0)
const layout = computed(() => classicLayout(props.spec.data, { hasLogo: hasLogo.value, variant: variant.value }))
// En la variante "banda", título y logo van sobre el acento (su texto, onAccent, llega a 7:1).
const titleBackground = computed(() => (layout.value.titleBand ? [palette.value.accent] : palette.value.background))
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <EdgeDecoration :variant="variant" :accent="palette.accent" />
    <div
      v-if="layout.titleBand"
      :data-bg="palette.accent"
      :style="{
        position: 'absolute',
        left: `${layout.titleBand.x}px`,
        top: `${layout.titleBand.y}px`,
        width: `${layout.titleBand.width}px`,
        height: `${layout.titleBand.height}px`,
        background: palette.accent,
        color: palette.onAccent,
      }"
    />
    <div :data-bg="titleBackground.join(',')" :style="{ color: layout.titleBand ? palette.onAccent : palette.text }">
      <SlideText v-if="layout.title" :slot="layout.title" :text="spec.data.title!.text" :font-family="palette.fontFamily" />
      <LogoSlot
        v-if="layout.logo"
        :selection="spec.logo"
        :ministries="ctx.ministries"
        :background="titleBackground"
        :box="layout.logo"
        :load-image="ctx.loadImage"
      />
    </div>
    <template v-for="r in layout.rows" :key="r.slot.id">
      <IconChip :name="r.row.icon" :box="r.chip" :background="palette.accent" :color="palette.onAccent" :radius="CHIP_RADIUS[variant]" />
      <SlideText :slot="r.slot" :text="r.row.text" :font-family="palette.fontFamily" />
    </template>
  </SlideBackground>
</template>
