<script setup lang="ts">
// Estilo "Himnario": tapa de himnario en tela con letras doradas. La fecha ocupa el lugar del
// número del himno, en una columna a la izquierda; título y datos a la derecha, tras un filete doble.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import { accentInk } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import Fleuron from '../parts/Fleuron.vue'
import HimnarioCover from '../parts/HimnarioCover.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import PhotoCutout from '../parts/PhotoCutout.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import TypeEmblem from '../parts/TypeEmblem.vue'
import { CLOTH_OPACITY } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { SAFE_BOTTOM, SAFE_RIGHT, detailRows, lineSlot, monthLabel, stackRows, titleSlot, visualPhoto } from './layout'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const COLUMN = { x: 128, width: 464 }
const RULE_X = 652
const RIGHT_X = 716
const BOTTOM = SAFE_BOTTOM - 16
// Visual: la foto de pie sobre el filete inferior del marco, a la derecha y de alto completo.
const PHOTO = { x: 1328, y: 120, width: 528, height: 904 }
const PHOTO_GAP = 40

const palette = computed(() => props.spec.palette)
const background = computed(() => texturedStops(palette.value.background, palette.value.text, CLOTH_OPACITY))
const gold = computed(() => accentInk(palette.value.accent, background.value, palette.value.text))
const photo = computed(() => visualPhoto(props.spec))
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)

const layout = computed(() => {
  const data = props.spec.data
  const when = data.when
  const [dateKey, timeKey] = when?.fieldKeys ?? []
  const right = photo.value ? PHOTO.x - PHOTO_GAP : SAFE_RIGHT
  const stack = stackRows(detailRows(data), { x: RIGHT_X, width: right - RIGHT_X, bottom: BOTTOM, marker: 22, markerGap: 30 })
  const hasRows = stack.rows.length > 0
  const ornamentY = stack.top - 76
  const titleBottom = hasRows ? ornamentY - 20 : BOTTOM
  return {
    weekday: when && { slot: lineSlot('fecha-semana', dateKey, { ...COLUMN, y: 104, height: 84 }, 64, { uppercase: true, align: 'center' }), text: when.relative ?? when.weekday },
    day: when && { slot: lineSlot('fecha-dia', dateKey, { ...COLUMN, y: 184, height: 444 }, 370, { align: 'center' }), text: when.day },
    month: when && { slot: lineSlot('fecha-mes', dateKey, { ...COLUMN, y: 628, height: 84 }, 64, { uppercase: true, align: 'center' }), text: monthLabel(when) },
    time: when?.time ? { slot: lineSlot('fecha-hora', timeKey, { ...COLUMN, y: 744, height: 84 }, 64, { align: 'center' }), text: when.time } : undefined,
    logo: hasLogo.value ? { ...COLUMN, y: 868, height: 132 } : undefined,
    title: data.title && {
      slot: { ...titleSlot(data.title.fieldKey, { x: RIGHT_X, y: 104, width: right - RIGHT_X, height: titleBottom - 104 }), valign: hasRows ? ('bottom' as const) : ('center' as const) },
      text: data.title.text,
    },
    ornament: hasRows ? { x: RIGHT_X, y: ornamentY, width: 264, height: 44 } : undefined,
    rows: stack.rows,
  }
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <HimnarioCover :palette="palette" />
    <!-- Filete doble entre la columna de la fecha y el contenido, con sus rombos. -->
    <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <path :d="`M${RULE_X} 120V${BOTTOM - 16}M${RULE_X + 10} 120V${BOTTOM - 16}`" :stroke="palette.accent" stroke-width="1.5" />
      <g :fill="palette.accent">
        <polygon :points="`${RULE_X + 5},96 ${RULE_X + 17},108 ${RULE_X + 5},120 ${RULE_X - 7},108`" />
        <polygon :points="`${RULE_X + 5},${BOTTOM - 16} ${RULE_X + 17},${BOTTOM - 4} ${RULE_X + 5},${BOTTOM + 8} ${RULE_X - 7},${BOTTOM - 4}`" />
      </g>
    </svg>

    <div :data-bg="background.join(',')">
      <!-- Columna de la fecha, en "letras doradas". -->
      <div :style="{ color: gold }">
        <template v-if="layout.day">
          <SlideText :slot="layout.weekday!.slot" :text="layout.weekday!.text" :font-family="palette.fontFamily" />
          <SlideText :slot="layout.day.slot" :text="layout.day.text" :font-family="palette.fontFamily" />
          <SlideText :slot="layout.month!.slot" :text="layout.month!.text" :font-family="palette.fontFamily" />
        </template>
        <TypeEmblem v-else :type-id="spec.data.typeId" :box="{ ...COLUMN, y: 220, height: 400 }" :color="palette.accent" :stroke-width="1.25" />
        <SlideText v-if="layout.time" :slot="layout.time.slot" :text="layout.time.text" :font-family="palette.fontFamily" />
      </div>
      <LogoGroup
        v-if="layout.logo"
        :selection="spec.logo"
        :ministries="ctx.ministries"
        :background="background"
        :box="layout.logo"
        :divider="palette.accent"
        align="center"
        :load-image="ctx.loadImage"
      />

      <PhotoCutout v-if="photo" :image-id="photo" :box="PHOTO" :load-image="ctx.loadImage" />
      <SlideText v-if="layout.title" :slot="layout.title.slot" :text="layout.title.text" :font-family="palette.fontFamily" />
      <Fleuron v-if="layout.ornament" :box="layout.ornament" :color="palette.accent" />
      <template v-for="r in layout.rows" :key="r.slot.id">
        <svg aria-hidden="true" viewBox="0 0 22 22" :width="r.marker.width" :height="r.marker.height" :style="{ position: 'absolute', left: `${r.marker.x}px`, top: `${r.marker.y}px` }">
          <polygon points="11,0 22,11 11,22 0,11" :fill="palette.accent" />
        </svg>
        <SlideText :slot="r.slot" :text="r.row.text" :font-family="palette.fontFamily" />
      </template>
    </div>
  </SlideBackground>
</template>
