<script setup lang="ts">
// Portada "Almanaque": el almanaque de la iglesia. A la izquierda, el logo grande y el título; a la
// derecha, la hoja con la fecha de la presentación, el nombre de la iglesia en la cabecera y el año en el talón.
import { computed } from 'vue'
import type { TextSlotDef } from '../../engine'
import type { SlideContext, SlideSpec } from '../contract'
import AlmanaqueSheet from '../parts/AlmanaqueSheet.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import { texturedStops } from '../parts/texture'
import { coverDate } from './coverDate'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'cover' | 'closing' }>; ctx: SlideContext }>()

const LINES = 0.09
const SHEET = { x: 1216, y: 88, width: 576, height: 904, headerBottom: 244 }
const PERFORATION_Y = 858
const PAD = { x: SHEET.x + 16, width: SHEET.width - 32 }
const line = (id: string, y: number, height: number, maxFontSize: number, uppercase = false): TextSlotDef => ({
  id,
  role: 'key',
  box: { ...PAD, y, height },
  maxLines: 1,
  maxFontSize,
  uppercase,
  align: 'center',
})
const CHURCH = line('portada-iglesia', 124, 84, 64, true)
const WEEKDAY = line('portada-semana', 264, 84, 64, true)
const DAY = line('portada-dia', 336, 420, 350)
const MONTH = line('portada-mes', 752, 84, 64, true)
const YEAR = line('portada-anio', 886, 84, 64)
const LOGO = { x: 96, y: 112, width: 1000, height: 320 }
const TITLE: TextSlotDef = { id: 'portada-titulo', role: 'title', box: { x: 96, y: 480, width: 1040, height: 460 }, maxLines: 2, maxFontSize: 230 }

const palette = computed(() => props.spec.palette)
const lined = computed(() => texturedStops(palette.value.background, palette.value.text, LINES))
const date = computed(() => coverDate(props.ctx))
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <Texture kind="renglones" :ink="palette.text" :opacity="LINES" :box="{ x: 0, y: 0, width: 1176, height: 1080 }" />
    <AlmanaqueSheet :palette="palette" :sheet="SHEET" :perforation-y="PERFORATION_Y" />
    <div :data-bg="palette.field" :style="{ color: palette.onField }">
      <SlideText :slot="CHURCH" :text="ctx.settings.churchName" :font-family="palette.fontFamily" />
      <SlideText :slot="WEEKDAY" :text="date.weekday" :font-family="palette.fontFamily" />
      <SlideText :slot="DAY" :text="date.day" :font-family="palette.fontFamily" />
      <SlideText :slot="MONTH" :text="date.month" :font-family="palette.fontFamily" />
      <SlideText :slot="YEAR" :text="date.year" :font-family="palette.fontFamily" />
    </div>
    <div :data-bg="lined.join(',')">
      <LogoGroup :selection="{ kind: 'iglesia' }" :ministries="ctx.ministries" :background="lined" :box="LOGO" cover align="start" :load-image="ctx.loadImage" />
      <SlideText :slot="TITLE" :text="ctx.settings.coverTitle" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
