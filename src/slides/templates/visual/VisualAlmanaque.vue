<script setup lang="ts">
// Visual "Almanaque": la persona de pie delante de un sol del color del tipo, sobre los renglones.
// A la izquierda, una hojita de almanaque con el día; al lado, el día de la semana, el mes y la hora,
// y debajo el título, el nombre de la persona y los datos con sus íconos.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import { iconFor } from '../../icons'
import { accentInk } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import { lineSlot, monthLabel } from '../classic/layout'
import AlmanaqueSheet from '../parts/AlmanaqueSheet.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import PhotoCutout from '../parts/PhotoCutout.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import { texturedStops } from '../parts/texture'
import { PHOTO_TOP, VISUAL_LOGO, visualColumn } from './layout'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const LINES = 0.09
const COLUMN = { x: 96, width: 904 }
const SHEET = { x: 96, y: 88, width: 330, height: 400, headerBottom: 150 }
const PAD = { x: SHEET.x + 14, width: SHEET.width - 28 }
const SIDE_X = SHEET.x + SHEET.width + 44
const ICON = 56
const SUN = { cx: 1420, cy: 650, r: 390 }
const PHOTO = { x: 1040, y: PHOTO_TOP, width: 760, height: 1080 - PHOTO_TOP }

const palette = computed(() => props.spec.palette)
const lined = computed(() => texturedStops(palette.value.background, palette.value.text, LINES))
const ink = computed(() => accentInk(palette.value.accent, lined.value, palette.value.text))
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)

const layout = computed(() => {
  const data = props.spec.data
  const when = data.when
  const [dateKey, timeKey] = when?.fieldKeys ?? []
  const side = (id: string, key: string | undefined, y: number, text: string) => ({
    slot: lineSlot(id, key, { x: SIDE_X, width: COLUMN.x + COLUMN.width - SIDE_X, y, height: 88 }, 72, { uppercase: true }),
    text,
  })
  const column = visualColumn(data, { ...COLUMN, top: 520, bottom: 1000, marker: ICON, markerGap: 28, titleMax: 150 })
  return {
    day: when && { slot: lineSlot('fecha-dia', dateKey, { ...PAD, y: 164, height: 310 }, 270, { align: 'center' }), text: when.day },
    side: when
      ? [side('fecha-semana', dateKey, 120, when.relative ?? when.weekday), side('fecha-mes', dateKey, 220, monthLabel(when)), ...(when.time ? [side('fecha-hora', timeKey, 320, when.time)] : [])]
      : [],
    column,
    person: column.person && { ...column.person, icon: iconFor(data.rows.find((r) => r.text === column.person!.text)?.icon) },
    rows: column.rows.map((r) => ({ ...r, icon: iconFor(r.row.icon) })),
  }
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <Texture kind="renglones" :ink="palette.text" :opacity="LINES" />
    <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <circle :cx="SUN.cx" :cy="SUN.cy" :r="SUN.r" :fill="palette.field" />
      <circle :cx="SUN.cx" :cy="SUN.cy" :r="SUN.r + 26" fill="none" :stroke="palette.field" stroke-width="5" stroke-dasharray="5 15" stroke-linecap="round" />
    </svg>
    <AlmanaqueSheet :palette="palette" :sheet="SHEET" />
    <PhotoCutout :image-id="spec.data.imageId!" :box="PHOTO" :load-image="ctx.loadImage" />

    <div :data-bg="palette.field" :style="{ color: palette.onField }">
      <SlideText v-if="layout.day" :slot="layout.day.slot" :text="layout.day.text" :font-family="palette.fontFamily" />
    </div>

    <div :data-bg="lined.join(',')">
      <SlideText v-for="l in layout.side" :key="l.slot.id" :slot="l.slot" :text="l.text" :font-family="palette.fontFamily" />
      <LogoGroup v-if="hasLogo" :selection="spec.logo" :ministries="ctx.ministries" :background="lined" :box="VISUAL_LOGO" :divider="palette.accent" :load-image="ctx.loadImage" />
      <SlideText v-if="layout.column.title" :slot="layout.column.title.slot" :text="layout.column.title.text" :font-family="palette.fontFamily" />
      <template v-if="layout.person">
        <div v-if="layout.person.icon" :style="{ position: 'absolute', left: `${layout.person.marker.x}px`, top: `${layout.person.marker.y}px`, width: `${ICON}px`, height: `${ICON}px`, color: ink }">
          <component :is="layout.person.icon" data-icon :size="ICON" :stroke-width="2.25" aria-hidden="true" />
        </div>
        <div :style="{ color: ink }">
          <SlideText :slot="layout.person.slot" :text="layout.person.text" :font-family="palette.fontFamily" />
        </div>
      </template>
      <template v-for="r in layout.rows" :key="r.slot.id">
        <div v-if="r.icon" :style="{ position: 'absolute', left: `${r.marker.x}px`, top: `${r.marker.y}px`, width: `${ICON}px`, height: `${ICON}px`, color: ink }">
          <component :is="r.icon" data-icon :size="ICON" :stroke-width="2.25" aria-hidden="true" />
        </div>
        <SlideText :slot="r.slot" :text="r.row.text" :font-family="palette.fontFamily" />
      </template>
    </div>
  </SlideBackground>
</template>
