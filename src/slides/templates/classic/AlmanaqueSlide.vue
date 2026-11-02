<script setup lang="ts">
// Estilo "Almanaque": la hoja de un almanaque de pared, del color del tipo, con los logos en la
// cabecera como en los almanaques de la iglesia o del colmado. La hora va en el talón, tras la línea
// de picado, y esa línea sigue por la derecha hasta los datos. Título y datos sobre renglones.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import { iconFor } from '../../icons'
import { accentInk } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import AlmanaqueSheet from '../parts/AlmanaqueSheet.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import TypeEmblem from '../parts/TypeEmblem.vue'
import { sheetSeam } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { SAFE_BOTTOM, SAFE_RIGHT, detailRows, lineSlot, monthLabel, stackRows, titleSlot } from './layout'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const LINES = 0.09
const SHEET = { x: 128, y: 88, width: 576, height: 904, headerBottom: 244 }
const PERFORATION_Y = 858
const PAD = { x: SHEET.x + 16, width: SHEET.width - 32 }
const RIGHT_X = 800
const ICON = 56
const BOTTOM = SAFE_BOTTOM - 16

const palette = computed(() => props.spec.palette)
const lined = computed(() => texturedStops(palette.value.background, palette.value.text, LINES))
const ink = computed(() => accentInk(palette.value.accent, lined.value, palette.value.text))
const seam = computed(() => sheetSeam(palette.value))
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)

const layout = computed(() => {
  const data = props.spec.data
  const when = data.when
  const [dateKey, timeKey] = when?.fieldKeys ?? []
  const right = SAFE_RIGHT
  const stack = stackRows(detailRows(data), { x: RIGHT_X, width: right - RIGHT_X, bottom: BOTTOM, marker: ICON, markerGap: 28 })
  const hasRows = stack.rows.length > 0
  const tearY = stack.top - 48
  const titleBottom = hasRows ? tearY - 36 : BOTTOM
  return {
    weekday: when && { slot: lineSlot('fecha-semana', dateKey, { ...PAD, y: 264, height: 84 }, 64, { uppercase: true, align: 'center' }), text: when.relative ?? when.weekday },
    day: when && { slot: lineSlot('fecha-dia', dateKey, { ...PAD, y: 336, height: 420 }, 350, { align: 'center' }), text: when.day },
    month: when && { slot: lineSlot('fecha-mes', dateKey, { ...PAD, y: 752, height: 84 }, 64, { uppercase: true, align: 'center' }), text: monthLabel(when) },
    time: when?.time ? { slot: lineSlot('fecha-hora', timeKey, { ...PAD, y: 886, height: 84 }, 64, { align: 'center' }), text: when.time } : undefined,
    logo: hasLogo.value ? { x: PAD.x + 24, y: SHEET.y + 18, width: PAD.width - 48, height: SHEET.headerBottom - SHEET.y - 36 } : undefined,
    title: data.title && {
      slot: { ...titleSlot(data.title.fieldKey, { x: RIGHT_X, y: 96, width: right - RIGHT_X, height: titleBottom - 96 }), valign: hasRows ? ('bottom' as const) : ('center' as const) },
      text: data.title.text,
    },
    tearY: hasRows ? tearY : undefined,
    right,
    rows: stack.rows.map((r) => ({ ...r, icon: iconFor(r.row.icon) })),
  }
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <Texture kind="renglones" :ink="palette.text" :opacity="LINES" :box="{ x: 744, y: 0, width: 1176, height: 1080 }" />
    <AlmanaqueSheet :palette="palette" :sheet="SHEET" :perforation-y="layout.time ? PERFORATION_Y : undefined" />

    <div :data-bg="palette.field" :style="{ color: palette.onField }">
      <LogoGroup
        v-if="layout.logo"
        :selection="spec.logo"
        :ministries="ctx.ministries"
        :background="[palette.field]"
        :box="layout.logo"
        :divider="seam"
        align="center"
        :load-image="ctx.loadImage"
      />
      <TypeEmblem v-else :type-id="spec.data.typeId" :box="{ ...PAD, y: SHEET.y + 28, height: 100 }" :color="seam" :stroke-width="2" />
      <template v-if="layout.day">
        <SlideText :slot="layout.weekday!.slot" :text="layout.weekday!.text" :font-family="palette.fontFamily" />
        <SlideText :slot="layout.day.slot" :text="layout.day.text" :font-family="palette.fontFamily" />
        <SlideText :slot="layout.month!.slot" :text="layout.month!.text" :font-family="palette.fontFamily" />
      </template>
      <TypeEmblem v-else :type-id="spec.data.typeId" :box="{ ...PAD, y: 360, height: 360 }" :color="palette.onField" :stroke-width="1.25" />
      <SlideText v-if="layout.time" :slot="layout.time.slot" :text="layout.time.text" :font-family="palette.fontFamily" />
    </div>

    <!-- La línea de picado continúa hasta los datos: la fecha y su información van juntas. -->
    <svg v-if="layout.tearY" aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <path :d="`M${SHEET.x + SHEET.width + 40} ${layout.tearY}H${layout.right}`" :stroke="palette.accent" stroke-width="5" stroke-dasharray="5 15" stroke-linecap="round" />
    </svg>


    <div :data-bg="lined.join(',')">
      <SlideText v-if="layout.title" :slot="layout.title.slot" :text="layout.title.text" :font-family="palette.fontFamily" />
      <template v-for="r in layout.rows" :key="r.slot.id">
        <div
          v-if="r.icon"
          :style="{ position: 'absolute', left: `${r.marker.x}px`, top: `${r.marker.y}px`, width: `${ICON}px`, height: `${ICON}px`, color: ink }"
        >
          <component :is="r.icon" data-icon :size="ICON" :stroke-width="2.25" aria-hidden="true" />
        </div>
        <SlideText :slot="r.slot" :text="r.row.text" :font-family="palette.fontFamily" />
      </template>
    </div>
  </SlideBackground>
</template>
