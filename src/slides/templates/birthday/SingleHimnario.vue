<script setup lang="ts">
// Cumpleaños individual, estilo Himnario: la tapa de tela con el día del cumpleaños como número del
// himno en dorado; a la derecha el mensaje, el nombre enorme y el versículo tras un ornamento. Con
// foto, la foto va en un arco de vitral con marco dorado en la columna y el día pasa bajo el nombre.
import { computed } from 'vue'
import { logoGroupFor } from '../../../data/ministries'
import { monthName } from '../../../lib/format'
import type { TextSlotDef } from '../../engine'
import { accentInk } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import Fleuron from '../parts/Fleuron.vue'
import FramedPhoto from '../parts/FramedPhoto.vue'
import HimnarioCover from '../parts/HimnarioCover.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import TypeEmblem from '../parts/TypeEmblem.vue'
import { CLOTH_OPACITY } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { singleSlots } from './single'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'birthday-single' }>; ctx: SlideContext }>()

const COLUMN = { x: 128, width: 464 }
const RULE_X = 652
const RIGHT = { x: 716, width: 1824 - 716 }
const BOTTOM = 1000
const PHOTO = { ...COLUMN, y: 112, height: 720 }

const palette = computed(() => props.spec.palette)
const background = computed(() => texturedStops(palette.value.background, palette.value.text, CLOTH_OPACITY))
const gold = computed(() => accentInk(palette.value.accent, background.value, palette.value.text))
const hasLogo = computed(() => logoGroupFor(props.spec.logo, props.ctx.ministries).length > 0)
const photo = computed(() => props.spec.person.photoId)

const DAY: TextSlotDef = { id: 'dia', role: 'key', fieldKey: 'personas', box: { ...COLUMN, y: 170, height: 470 }, maxLines: 1, maxFontSize: 390, align: 'center' }
const MONTH: TextSlotDef = { id: 'mes', role: 'key', fieldKey: 'personas', box: { ...COLUMN, y: 640, height: 84 }, maxLines: 1, maxFontSize: 64, uppercase: true, align: 'center' }
const slots = computed(() => singleSlots(RIGHT, { top: 112, bottom: BOTTOM, withDayLine: !!photo.value, withVerse: !!props.spec.verse, ornament: 76 }))
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <HimnarioCover :palette="palette" />
    <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <path :d="`M${RULE_X} 120V${BOTTOM - 16}M${RULE_X + 10} 120V${BOTTOM - 16}`" :stroke="palette.accent" stroke-width="1.5" />
      <g :fill="palette.accent">
        <polygon :points="`${RULE_X + 5},96 ${RULE_X + 17},108 ${RULE_X + 5},120 ${RULE_X - 7},108`" />
        <polygon :points="`${RULE_X + 5},${BOTTOM - 16} ${RULE_X + 17},${BOTTOM - 4} ${RULE_X + 5},${BOTTOM + 8} ${RULE_X - 7},${BOTTOM - 4}`" />
      </g>
    </svg>

    <FramedPhoto v-if="photo" :image-id="photo" :box="PHOTO" shape="arch" :border="palette.accent" :border-width="8" :load-image="ctx.loadImage" />
    <div :data-bg="background.join(',')">
      <div :style="{ color: gold }">
        <template v-if="!photo">
          <Fleuron :box="{ x: COLUMN.x + 100, y: 112, width: 264, height: 44 }" :color="palette.accent" />
          <SlideText :slot="DAY" :text="String(spec.person.day)" :font-family="palette.fontFamily" />
          <SlideText :slot="MONTH" :text="monthName(spec.person.month)" :font-family="palette.fontFamily" />
        </template>
        <SlideText :slot="slots.message" :text="spec.message" :font-family="palette.fontFamily" />
        <SlideText v-if="slots.day" :slot="slots.day" :text="spec.dayText" :font-family="palette.fontFamily" />
      </div>
      <LogoGroup
        v-if="hasLogo"
        :selection="spec.logo"
        :ministries="ctx.ministries"
        :background="background"
        :box="{ ...COLUMN, y: 868, height: 132 }"
        :divider="palette.accent"
        align="center"
        :load-image="ctx.loadImage"
      />
      <TypeEmblem v-else-if="!photo" type-id="cumpleanos" :box="{ ...COLUMN, y: 800, height: 180 }" :color="palette.accent" :stroke-width="1.25" />
      <SlideText :slot="slots.name" :text="spec.person.name" :font-family="palette.fontFamily" />
      <Fleuron v-if="slots.ornamentY !== undefined" :box="{ x: RIGHT.x, y: slots.ornamentY, width: 264, height: 44 }" :color="palette.accent" />
      <SlideText v-if="slots.verse && spec.verse" :slot="slots.verse" :text="spec.verse" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
