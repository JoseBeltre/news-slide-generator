<script setup lang="ts">
// Portada "Cartel": el campo de color en diagonal con la fecha de la presentación enorme; a la
// izquierda, el logo de la iglesia grande y el título como cabecera del afiche.
import { computed } from 'vue'
import type { TextSlotDef } from '../../engine'
import type { SlideContext, SlideSpec } from '../contract'
import CartelField from '../parts/CartelField.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import { CARTEL } from '../parts/styleParts'
import { coverDate, frameTitle } from './coverDate'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'cover' | 'closing' }>; ctx: SlideContext }>()

const line = (id: string, y: number, height: number, maxFontSize: number, uppercase = false): TextSlotDef => ({
  id,
  role: 'key',
  box: { ...CARTEL.date, y, height },
  maxLines: 1,
  maxFontSize,
  uppercase,
  align: 'right',
})
const WEEKDAY = line('portada-semana', 96, 84, 70, true)
const DAY = line('portada-dia', 164, 492, 410)
const MONTH = line('portada-mes', 652, 96, 80, true)
const YEAR = line('portada-anio', 752, 96, 80)
const LOGO = { x: 96, y: 96, width: 860, height: 300 }
const TITLE: TextSlotDef = { id: 'portada-titulo', role: 'title', box: { x: 96, y: 470, width: 860, height: 520 }, maxLines: 2, maxFontSize: 240, valign: 'bottom' }
// Cierre (pedido del responsable): el saludo arriba y el logo debajo, más pequeño. Horizontal, no el centrado:
// el afiche va alineado a la izquierda.
const CLOSING = { title: { ...TITLE, box: { ...TITLE.box, y: 96, height: 500 } }, bar: 630, logo: { x: 96, y: 720, width: 640, height: 200 } }
const COVER = { title: TITLE, bar: 440, logo: LOGO }

const palette = computed(() => props.spec.palette)
const title = computed(() => frameTitle(props.spec, props.ctx))
const geo = computed(() => (props.spec.kind === 'closing' ? CLOSING : COVER))
const date = computed(() => coverDate(props.ctx))
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <CartelField :palette="palette" />
    <div :data-bg="palette.field" :style="{ color: palette.onField }">
      <SlideText :slot="WEEKDAY" :text="date.weekday" :font-family="palette.fontFamily" />
      <SlideText :slot="DAY" :text="date.day" :font-family="palette.fontFamily" />
      <SlideText :slot="MONTH" :text="date.month" :font-family="palette.fontFamily" />
      <SlideText :slot="YEAR" :text="date.year" :font-family="palette.fontFamily" />
    </div>
    <div :data-bg="palette.background.join(',')">
      <LogoGroup :selection="{ kind: 'iglesia' }" :ministries="ctx.ministries" :background="palette.background" :box="geo.logo" cover align="start" :load-image="ctx.loadImage" />
      <div aria-hidden="true" :style="{ position: 'absolute', left: '96px', top: `${geo.bar}px`, width: '200px', height: '10px', background: palette.accent }" />
      <SlideText :slot="geo.title" :text="title" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
