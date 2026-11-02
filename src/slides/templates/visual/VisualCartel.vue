<script setup lang="ts">
// Visual "Cartel": el campo de color se ensancha y es el escenario: la persona de pie sobre él, grande,
// con la trama de imprenta detrás. La fecha va en una etiqueta del color del tipo arriba a la izquierda;
// debajo, el título del afiche, el nombre de la persona con su raya y los datos.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import { mixColors } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import { lineSlot, monthLabel } from '../classic/layout'
import LogoGroup from '../parts/LogoGroup.vue'
import PhotoCutout from '../parts/PhotoCutout.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import { PHOTO_TOP, VISUAL_LOGO, visualColumn } from './layout'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const FIELD = '1240,0 1920,0 1920,1080 1040,1080'
const HALFTONE = '1108,0 1240,0 1040,1080 908,1080'
const STRIPE = '1064,0 1084,0 884,1080 864,1080'
const COLUMN = { x: 96, width: 748 }
const TAG = { x: 96, y: 96, width: 724, height: 248 }
const LINES_X = 356
const PHOTO = { x: 1000, y: PHOTO_TOP, width: 824, height: 1080 - PHOTO_TOP }

const palette = computed(() => props.spec.palette)
const halftoneInk = computed(() => mixColors(palette.value.field, palette.value.background[0]!, 0.15))
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)
const tagPoints = `${TAG.x},${TAG.y} ${TAG.x + TAG.width + 24},${TAG.y} ${TAG.x + TAG.width},${TAG.y + TAG.height} ${TAG.x},${TAG.y + TAG.height}`

const layout = computed(() => {
  const data = props.spec.data
  const when = data.when
  const [dateKey, timeKey] = when?.fieldKeys ?? []
  const line = (id: string, key: string | undefined, y: number, text: string) => ({
    slot: lineSlot(id, key, { x: LINES_X, width: TAG.x + TAG.width - 24 - LINES_X, y, height: 74 }, 62, { uppercase: true }),
    text,
  })
  return {
    day: when && { slot: lineSlot('fecha-dia', dateKey, { x: TAG.x + 20, width: 220, y: TAG.y + 4, height: 240 }, 210, { align: 'center' }), text: when.day },
    lines: when
      ? [line('fecha-semana', dateKey, 112, when.relative ?? when.weekday), line('fecha-mes', dateKey, 184, monthLabel(when)), ...(when.time ? [line('fecha-hora', timeKey, 256, when.time)] : [])]
      : [],
    column: visualColumn(data, { ...COLUMN, top: 392, bottom: 1000, marker: 36, markerGap: 22, titleMax: 150 }),
  }
})
const dash = (m: { x: number; y: number; width: number; height: number }) => ({
  position: 'absolute' as const,
  left: `${m.x}px`,
  top: `${m.y + m.height / 2 - 4}px`,
  width: `${m.width}px`,
  height: '8px',
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <polygon :points="STRIPE" :fill="palette.field" />
      <polygon :points="FIELD" :fill="palette.field" />
      <polygon v-if="layout.day" :points="tagPoints" :fill="palette.field" />
    </svg>
    <Texture kind="trama" :ink="halftoneInk" :opacity="1" :clip="HALFTONE" />
    <PhotoCutout :image-id="spec.data.imageId!" :box="PHOTO" :load-image="ctx.loadImage" />

    <div :data-bg="palette.field" :style="{ color: palette.onField }">
      <SlideText v-if="layout.day" :slot="layout.day.slot" :text="layout.day.text" :font-family="palette.fontFamily" />
      <SlideText v-for="l in layout.lines" :key="l.slot.id" :slot="l.slot" :text="l.text" :font-family="palette.fontFamily" />
      <LogoGroup v-if="hasLogo" :selection="spec.logo" :ministries="ctx.ministries" :background="[palette.field]" :box="VISUAL_LOGO" :divider="palette.onField" :load-image="ctx.loadImage" />
    </div>

    <div :data-bg="palette.background.join(',')">
      <SlideText v-if="layout.column.title" :slot="layout.column.title.slot" :text="layout.column.title.text" :font-family="palette.fontFamily" />
      <template v-if="layout.column.person">
        <div aria-hidden="true" :style="{ ...dash(layout.column.person.marker), background: palette.accent }" />
        <SlideText :slot="layout.column.person.slot" :text="layout.column.person.text" :font-family="palette.fontFamily" />
      </template>
      <template v-for="r in layout.column.rows" :key="r.slot.id">
        <div aria-hidden="true" :style="{ ...dash(r.marker), background: palette.accent }" />
        <SlideText :slot="r.slot" :text="r.row.text" :font-family="palette.fontFamily" />
      </template>
    </div>
  </SlideBackground>
</template>
