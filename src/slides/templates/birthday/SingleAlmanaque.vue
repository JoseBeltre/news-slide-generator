<script setup lang="ts">
// Cumpleaños individual, estilo Almanaque: la hoja del almanaque marca el día del cumpleaños (con
// "CUMPLEAÑOS" donde va el día de la semana) y los logos en la cabecera; a la derecha, sobre los
// renglones, el mensaje, el nombre enorme y el versículo tras la línea de picado. Con foto, una foto
// impresa de borde ancho, prendida un poco torcida arriba a la derecha.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import { monthName } from '../../../lib/format'
import type { TextSlotDef } from '../../engine'
import type { SlideContext, SlideSpec } from '../contract'
import AlmanaqueSheet from '../parts/AlmanaqueSheet.vue'
import FramedPhoto from '../parts/FramedPhoto.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import TypeEmblem from '../parts/TypeEmblem.vue'
import { sheetSeam } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { singleSlots } from './single'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'birthday-single' }>; ctx: SlideContext }>()

const LINES = 0.09
const SHEET = { x: 128, y: 88, width: 576, height: 904, headerBottom: 244 }
const PAD = { x: SHEET.x + 16, width: SHEET.width - 32 }
const RIGHT = { x: 800, width: 1824 - 800 }
const BOTTOM = 1000
const ORNAMENT = 56

const line = (id: string, y: number, height: number, maxFontSize: number, uppercase = false): TextSlotDef => ({
  id,
  role: 'key',
  fieldKey: 'personas',
  box: { ...PAD, y, height },
  maxLines: 1,
  maxFontSize,
  uppercase,
  align: 'center',
})
const LABEL = line('etiqueta', 264, 84, 64, true)
const DAY = line('dia', 336, 420, 350)
const MONTH = line('mes', 752, 84, 64, true)

const palette = computed(() => props.spec.palette)
const lined = computed(() => texturedStops(palette.value.background, palette.value.text, LINES))
const seam = computed(() => sheetSeam(palette.value))
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)
const photo = computed(() => props.spec.person.photoId)

// La foto impresa: más chica si hay versículo, para dejarle al nombre sus dos líneas.
const photoBox = computed(() => (props.spec.verse ? { x: 1504, y: 96, width: 320, height: 380 } : { x: 1434, y: 96, width: 390, height: 460 }))
const slots = computed(() => {
  const withVerse = !!props.spec.verse
  if (!photo.value) return singleSlots(RIGHT, { top: 112, bottom: BOTTOM, withDayLine: false, withVerse, ornament: ORNAMENT })
  const nameTop = photoBox.value.y + photoBox.value.height + 20
  const s = singleSlots(RIGHT, { top: 112, bottom: BOTTOM, messageHeight: nameTop - 20 - 112, withDayLine: false, withVerse, ornament: ORNAMENT })
  // El mensaje va a la izquierda de la foto, un poco más chico para que "¡Feliz cumpleaños!" quepa en una línea.
  return { ...s, message: { ...s.message, maxFontSize: 64, box: { ...s.message.box, width: photoBox.value.x - 48 - RIGHT.x } } }
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <Texture kind="renglones" :ink="palette.text" :opacity="LINES" :box="{ x: 744, y: 0, width: 1176, height: 1080 }" />
    <AlmanaqueSheet :palette="palette" :sheet="SHEET" />

    <div :data-bg="palette.field" :style="{ color: palette.onField }">
      <LogoGroup
        v-if="hasLogo"
        :selection="spec.logo"
        :ministries="ctx.ministries"
        :background="[palette.field]"
        :box="{ x: PAD.x + 24, y: SHEET.y + 18, width: PAD.width - 48, height: SHEET.headerBottom - SHEET.y - 36 }"
        :divider="seam"
        align="center"
        :load-image="ctx.loadImage"
      />
      <TypeEmblem v-else type-id="cumpleanos" :box="{ ...PAD, y: SHEET.y + 28, height: 100 }" :color="seam" :stroke-width="2" />
      <SlideText :slot="LABEL" text="Cumpleaños" :font-family="palette.fontFamily" />
      <SlideText :slot="DAY" :text="String(spec.person.day)" :font-family="palette.fontFamily" />
      <SlideText :slot="MONTH" :text="monthName(spec.person.month)" :font-family="palette.fontFamily" />
    </div>

    <svg v-if="slots.ornamentY !== undefined" aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <path :d="`M${SHEET.x + SHEET.width + 40} ${slots.ornamentY + 22}H1824`" :stroke="palette.accent" stroke-width="5" stroke-dasharray="5 15" stroke-linecap="round" />
    </svg>
    <FramedPhoto v-if="photo" :image-id="photo" :box="photoBox" border="#fbfaf6" :border-width="16" :rotate="2.5" :load-image="ctx.loadImage" />

    <div :data-bg="lined.join(',')">
      <SlideText :slot="slots.message" :text="spec.message" :font-family="palette.fontFamily" />
      <SlideText :slot="slots.name" :text="spec.person.name" :font-family="palette.fontFamily" />
      <SlideText v-if="slots.verse && spec.verse" :slot="slots.verse" :text="spec.verse" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
