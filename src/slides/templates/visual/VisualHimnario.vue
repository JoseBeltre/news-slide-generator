<script setup lang="ts">
// Visual "Himnario": la persona de pie en un arco de vitral con marco dorado doble, como una ventana
// del templo; la cabeza puede asomar sobre el arco. A la izquierda, la fecha como número del himno con
// sus líneas, el título, el nombre de la persona en dorado y los datos con rombos.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import { accentInk, mixColors } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import { lineSlot, monthLabel } from '../classic/layout'
import HimnarioCover from '../parts/HimnarioCover.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import PhotoCutout from '../parts/PhotoCutout.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import { CLOTH_OPACITY } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { PHOTO_TOP, VISUAL_LOGO, visualColumn } from './layout'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const COLUMN = { x: 128, width: 872 }
const DAY_BOX = { x: 128, width: 240 }
const LINES_X = 432
const ARCH = { x: 1060, width: 730, top: PHOTO_TOP, bottom: 1032 }
const PHOTO = { x: ARCH.x + 20, y: ARCH.top + 46, width: ARCH.width - 40, height: ARCH.bottom - ARCH.top - 46 }

const palette = computed(() => props.spec.palette)
const background = computed(() => texturedStops(palette.value.background, palette.value.text, CLOTH_OPACITY))
const gold = computed(() => accentInk(palette.value.accent, background.value, palette.value.text))
const glass = computed(() => mixColors(palette.value.field, palette.value.background[0]!, 0.35))
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)

const archPath = (inset: number) => {
  const x1 = ARCH.x + inset
  const x2 = ARCH.x + ARCH.width - inset
  const r = (x2 - x1) / 2
  const top = ARCH.top + inset
  return `M${x1} ${ARCH.bottom}V${top + r}A${r} ${r} 0 0 1 ${x2} ${top + r}V${ARCH.bottom}Z`
}

const layout = computed(() => {
  const data = props.spec.data
  const when = data.when
  const [dateKey, timeKey] = when?.fieldKeys ?? []
  const line = (id: string, key: string | undefined, y: number, text: string) => ({
    slot: lineSlot(id, key, { x: LINES_X, width: COLUMN.x + COLUMN.width - LINES_X, y, height: 76 }, 64, { uppercase: true }),
    text,
  })
  return {
    day: when && { slot: lineSlot('fecha-dia', dateKey, { ...DAY_BOX, y: 104, height: 260 }, 240, { align: 'center' }), text: when.day },
    lines: when
      ? [line('fecha-semana', dateKey, 120, when.relative ?? when.weekday), line('fecha-mes', dateKey, 196, monthLabel(when)), ...(when.time ? [line('fecha-hora', timeKey, 272, when.time)] : [])]
      : [],
    column: visualColumn(data, { ...COLUMN, top: 396, bottom: 1000, marker: 22, markerGap: 30, titleMax: 150 }),
  }
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <HimnarioCover :palette="palette" />
    <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <path :d="archPath(0)" :fill="glass" :stroke="palette.accent" stroke-width="5" />
      <path :d="archPath(16)" fill="none" :stroke="palette.accent" stroke-width="1.5" />
      <!-- Filete doble entre el número y sus líneas. -->
      <path v-if="layout.day" :d="`M${LINES_X - 40} 124V344M${LINES_X - 30} 124V344`" :stroke="palette.accent" stroke-width="1.5" />
    </svg>
    <PhotoCutout :image-id="spec.data.imageId!" :box="PHOTO" :load-image="ctx.loadImage" />

    <div :data-bg="background.join(',')">
      <div :style="{ color: gold }">
        <SlideText v-if="layout.day" :slot="layout.day.slot" :text="layout.day.text" :font-family="palette.fontFamily" />
        <SlideText v-for="l in layout.lines" :key="l.slot.id" :slot="l.slot" :text="l.text" :font-family="palette.fontFamily" />
      </div>
      <LogoGroup v-if="hasLogo" :selection="spec.logo" :ministries="ctx.ministries" :background="background" :box="VISUAL_LOGO" :divider="palette.accent" :load-image="ctx.loadImage" />

      <SlideText v-if="layout.column.title" :slot="layout.column.title.slot" :text="layout.column.title.text" :font-family="palette.fontFamily" />
      <template v-if="layout.column.person">
        <svg aria-hidden="true" viewBox="0 0 22 22" :width="layout.column.person.marker.width" :height="layout.column.person.marker.height" :style="{ position: 'absolute', left: `${layout.column.person.marker.x}px`, top: `${layout.column.person.marker.y}px` }">
          <polygon points="11,0 22,11 11,22 0,11" :fill="palette.accent" />
        </svg>
        <div :style="{ color: gold }">
          <SlideText :slot="layout.column.person.slot" :text="layout.column.person.text" :font-family="palette.fontFamily" />
        </div>
      </template>
      <template v-for="r in layout.column.rows" :key="r.slot.id">
        <svg aria-hidden="true" viewBox="0 0 22 22" :width="r.marker.width" :height="r.marker.height" :style="{ position: 'absolute', left: `${r.marker.x}px`, top: `${r.marker.y}px` }">
          <polygon points="11,0 22,11 11,22 0,11" :fill="palette.accent" />
        </svg>
        <SlideText :slot="r.slot" :text="r.row.text" :font-family="palette.fontFamily" />
      </template>
    </div>
  </SlideBackground>
</template>
