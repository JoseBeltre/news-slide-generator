<script setup lang="ts">
// Portada "Himnario": la tapa del himnario con el logo de la iglesia grande, el título en dorado
// entre dos ornamentos y la fecha de la presentación.
import { computed } from 'vue'
import type { TextSlotDef } from '../../engine'
import { accentInk } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import Fleuron from '../parts/Fleuron.vue'
import HimnarioCover from '../parts/HimnarioCover.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import { CLOTH_OPACITY } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { coverDate } from './coverDate'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'cover' | 'closing' }>; ctx: SlideContext }>()

const LOGO = { x: 460, y: 100, width: 1000, height: 330 }
const TITLE: TextSlotDef = { id: 'portada-titulo', role: 'title', box: { x: 160, y: 540, width: 1600, height: 220 }, maxLines: 1, maxFontSize: 200, align: 'center' }
const DATE: TextSlotDef = { id: 'portada-fecha', role: 'key', box: { x: 160, y: 790, width: 1600, height: 90 }, maxLines: 1, maxFontSize: 72, uppercase: true, align: 'center' }

const palette = computed(() => props.spec.palette)
const background = computed(() => texturedStops(palette.value.background, palette.value.text, CLOTH_OPACITY))
const gold = computed(() => accentInk(palette.value.accent, background.value, palette.value.text))
const dateText = computed(() => {
  const d = coverDate(props.ctx)
  return `${d.weekday} ${d.day} de ${d.month}`
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <HimnarioCover :palette="palette" />
    <Fleuron :box="{ x: 828, y: 470, width: 264, height: 44 }" :color="palette.accent" />
    <Fleuron :box="{ x: 828, y: 912, width: 264, height: 44 }" :color="palette.accent" />
    <div :data-bg="background.join(',')">
      <LogoGroup :selection="{ kind: 'iglesia' }" :ministries="ctx.ministries" :background="background" :box="LOGO" cover align="center" :load-image="ctx.loadImage" />
      <div :style="{ color: gold }">
        <SlideText :slot="TITLE" :text="ctx.settings.coverTitle" :font-family="palette.fontFamily" />
      </div>
      <SlideText :slot="DATE" :text="dateText" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
