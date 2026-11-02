<script setup lang="ts">
// Cumpleaños individual, estilo Cartel: el campo de color en diagonal lleva el día enorme y los logos;
// a la izquierda, el mensaje, el nombre como titular del afiche y el versículo tras el filete. Con
// foto, la foto va pegada en el campo, un poco torcida, el día debajo y los logos pasan arriba a la izquierda.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import { monthName } from '../../../lib/format'
import type { TextSlotDef } from '../../engine'
import type { SlideContext, SlideSpec } from '../contract'
import CartelField from '../parts/CartelField.vue'
import FramedPhoto from '../parts/FramedPhoto.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import { CARTEL } from '../parts/styleParts'
import { singleSlots } from './single'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'birthday-single' }>; ctx: SlideContext }>()

const DATE = CARTEL.date
const LEFT = { x: 96, width: 824 }
const BOTTOM = 1000
const ORNAMENT = 56
const PHOTO = { ...DATE, y: 104, height: 500 }
const LOGO_LEFT = { x: LEFT.x, y: 96, width: 600, height: 120 }

const line = (id: string, y: number, height: number, maxFontSize: number, uppercase = false): TextSlotDef => ({
  id,
  role: 'key',
  fieldKey: 'personas',
  box: { ...DATE, y, height },
  maxLines: 1,
  maxFontSize,
  uppercase,
  align: 'right',
})

const palette = computed(() => props.spec.palette)
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)
const photo = computed(() => props.spec.person.photoId)

const date = computed(() =>
  photo.value
    ? { day: line('dia', 624, 260, 230), month: line('mes', 884, 96, 80, true) }
    : { label: line('etiqueta', 96, 84, 70, true), day: line('dia', 164, 492, 410), month: line('mes', 652, 96, 80, true) },
)
// Con foto, los logos suben a la izquierda y el texto empieza debajo.
const top = computed(() => (photo.value && hasLogo.value ? LOGO_LEFT.y + LOGO_LEFT.height + 24 : 96))
const slots = computed(() => singleSlots(LEFT, { top: top.value, bottom: BOTTOM, messageHeight: 150, withDayLine: false, withVerse: !!props.spec.verse, ornament: ORNAMENT }))
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <CartelField :palette="palette" />
    <FramedPhoto v-if="photo" :image-id="photo" :box="PHOTO" :border="palette.onField" :border-width="10" :rotate="-2" :load-image="ctx.loadImage" />

    <div :data-bg="palette.field" :style="{ color: palette.onField }">
      <SlideText v-if="date.label" :slot="date.label" text="Cumpleaños" :font-family="palette.fontFamily" />
      <SlideText :slot="date.day" :text="String(spec.person.day)" :font-family="palette.fontFamily" />
      <SlideText :slot="date.month" :text="monthName(spec.person.month)" :font-family="palette.fontFamily" />
      <LogoGroup
        v-if="hasLogo && !photo"
        :selection="spec.logo"
        :ministries="ctx.ministries"
        :background="[palette.field]"
        :box="{ ...DATE, y: 872, height: 128 }"
        :divider="palette.onField"
        align="end"
        :load-image="ctx.loadImage"
      />
    </div>

    <div :data-bg="palette.background.join(',')">
      <LogoGroup
        v-if="hasLogo && photo"
        :selection="spec.logo"
        :ministries="ctx.ministries"
        :background="palette.background"
        :box="LOGO_LEFT"
        :divider="palette.accent"
        align="start"
        :load-image="ctx.loadImage"
      />
      <SlideText :slot="slots.message" :text="spec.message" :font-family="palette.fontFamily" />
      <SlideText :slot="slots.name" :text="spec.person.name" :font-family="palette.fontFamily" />
      <div
        v-if="slots.ornamentY !== undefined"
        aria-hidden="true"
        :style="{ position: 'absolute', left: `${LEFT.x}px`, top: `${slots.ornamentY + 19}px`, width: `${LEFT.width}px`, height: '6px', background: palette.accent }"
      />
      <SlideText v-if="slots.verse && spec.verse" :slot="slots.verse" :text="spec.verse" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
