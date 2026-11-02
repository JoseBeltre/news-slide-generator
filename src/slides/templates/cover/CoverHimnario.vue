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
import { coverDate, frameTitle } from './coverDate'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'cover' | 'closing' }>; ctx: SlideContext }>()

const LOGO = { x: 460, y: 100, width: 1000, height: 330 }
const TITLE: TextSlotDef = { id: 'portada-titulo', role: 'title', box: { x: 160, y: 540, width: 1600, height: 220 }, maxLines: 1, maxFontSize: 200, align: 'center' }
const DATE: TextSlotDef = { id: 'portada-fecha', role: 'key', box: { x: 160, y: 790, width: 1600, height: 90 }, maxLines: 1, maxFontSize: 72, uppercase: true, align: 'center' }
// Cierre (pedido del responsable): el saludo arriba y el logo centrado (vertical), más pequeño, debajo.
const CLOSING = {
  title: { ...TITLE, box: { ...TITLE.box, y: 150, height: 220 } },
  date: { ...DATE, box: { ...DATE.box, y: 390, height: 90 } },
  fleurons: [520, 940],
  logo: { x: 735, y: 620, width: 450, height: 260 },
}
const COVER = { title: TITLE, date: DATE, fleurons: [470, 912], logo: LOGO }

const palette = computed(() => props.spec.palette)
const title = computed(() => frameTitle(props.spec, props.ctx))
const geo = computed(() => (props.spec.kind === 'closing' ? CLOSING : COVER))
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
    <Fleuron v-for="y in geo.fleurons" :key="y" :box="{ x: 828, y, width: 264, height: 44 }" :color="palette.accent" />
    <div :data-bg="background.join(',')">
      <LogoGroup :selection="{ kind: 'iglesia' }" :ministries="ctx.ministries" :background="background" :box="geo.logo" cover align="center" :load-image="ctx.loadImage" />
      <div :style="{ color: gold }">
        <SlideText :slot="geo.title" :text="title" :font-family="palette.fontFamily" />
      </div>
      <SlideText :slot="geo.date" :text="dateText" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
