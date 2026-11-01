<script setup lang="ts">
// Estilo "Cartel": afiche de evento caribeño, de los que se pegan en la pared del colmado. Un campo
// de color del tipo entra en diagonal por la derecha y carga la fecha enorme; a la izquierda, título
// grande y datos. Entre los dos, una franja de trama de imprenta. Los logos van al pie del campo.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import type { SlideContext, SlideSpec } from '../contract'
import CartelField from '../parts/CartelField.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import PhotoCutout from '../parts/PhotoCutout.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import TypeEmblem from '../parts/TypeEmblem.vue'
import { CARTEL } from '../parts/styleParts'
import { SAFE_BOTTOM, detailRows, lineSlot, monthLabel, stackRows, titleSlot, visualPhoto } from './layout'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'announcement' }>; ctx: SlideContext }>()

const DATE = CARTEL.date
const LEFT = { x: 96, width: 824 }
const BOTTOM = SAFE_BOTTOM - 16
// Visual: la foto de pie sobre la franja diagonal, como en los afiches; el texto de la izquierda se estrecha.
const PHOTO = { x: 820, y: 200, width: 510, height: 880 }
const PHOTO_GAP = 24

const palette = computed(() => props.spec.palette)
const photo = computed(() => visualPhoto(props.spec))
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)

const layout = computed(() => {
  const data = props.spec.data
  const when = data.when
  const [dateKey, timeKey] = when?.fieldKeys ?? []
  const width = photo.value ? PHOTO.x - PHOTO_GAP - LEFT.x : LEFT.width
  const stack = stackRows(detailRows(data), { x: LEFT.x, width, bottom: BOTTOM, marker: 36, markerGap: 22 })
  const hasRows = stack.rows.length > 0
  const titleBottom = hasRows ? stack.top - 52 : BOTTOM
  return {
    weekday: when && { slot: lineSlot('fecha-semana', dateKey, { ...DATE, y: 96, height: 84 }, 70, { uppercase: true, align: 'right' }), text: when.relative ?? when.weekday },
    day: when && { slot: lineSlot('fecha-dia', dateKey, { ...DATE, y: 164, height: 492 }, 410, { align: 'right' }), text: when.day },
    month: when && { slot: lineSlot('fecha-mes', dateKey, { ...DATE, y: 652, height: 96 }, 80, { uppercase: true, align: 'right' }), text: monthLabel(when) },
    time: when?.time ? { slot: lineSlot('fecha-hora', timeKey, { ...DATE, y: 752, height: 96 }, 80, { align: 'right' }), text: when.time } : undefined,
    logo: hasLogo.value ? { ...DATE, y: 872, height: 128 } : undefined,
    title: data.title && {
      slot: { ...titleSlot(data.title.fieldKey, { x: LEFT.x, y: 96, width, height: titleBottom - 96 }, { maxFontSize: 150 }), valign: hasRows ? ('bottom' as const) : ('center' as const) },
      text: data.title.text,
    },
    rule: hasRows ? stack.top - 28 : undefined,
    rows: stack.rows,
    width,
  }
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <CartelField :palette="palette" />

    <div :data-bg="palette.field" :style="{ color: palette.onField }">
      <template v-if="layout.day">
        <SlideText :slot="layout.weekday!.slot" :text="layout.weekday!.text" :font-family="palette.fontFamily" />
        <SlideText :slot="layout.day.slot" :text="layout.day.text" :font-family="palette.fontFamily" />
        <SlideText :slot="layout.month!.slot" :text="layout.month!.text" :font-family="palette.fontFamily" />
      </template>
      <TypeEmblem v-else :type-id="spec.data.typeId" :box="{ ...DATE, y: 200, height: 440 }" :color="palette.onField" :stroke-width="1.25" />
      <SlideText v-if="layout.time" :slot="layout.time.slot" :text="layout.time.text" :font-family="palette.fontFamily" />
      <LogoGroup
        v-if="layout.logo"
        :selection="spec.logo"
        :ministries="ctx.ministries"
        :background="[palette.field]"
        :box="layout.logo"
        :divider="palette.onField"
        align="end"
        :load-image="ctx.loadImage"
      />
    </div>

    <PhotoCutout v-if="photo" :image-id="photo" :box="PHOTO" :load-image="ctx.loadImage" />

    <div :data-bg="palette.background.join(',')">
      <SlideText v-if="layout.title" :slot="layout.title.slot" :text="layout.title.text" :font-family="palette.fontFamily" />
      <div
        v-if="layout.rule !== undefined"
        aria-hidden="true"
        :style="{ position: 'absolute', left: `${LEFT.x}px`, top: `${layout.rule}px`, width: `${layout.width}px`, height: '6px', background: palette.accent }"
      />
      <template v-for="r in layout.rows" :key="r.slot.id">
        <div
          aria-hidden="true"
          :style="{ position: 'absolute', left: `${r.marker.x}px`, top: `${r.marker.y + r.marker.height / 2 - 4}px`, width: `${r.marker.width}px`, height: '8px', background: palette.accent }"
        />
        <SlideText :slot="r.slot" :text="r.row.text" :font-family="palette.fontFamily" />
      </template>
    </div>
  </SlideBackground>
</template>
