<script setup lang="ts">
// Cumpleaños individual (RF-22, RF-23): a la izquierda, globos grandes con gorrito o pastel (o la foto
// con el gorrito encima) y confeti de colores saliendo de las esquinas; a la derecha, el mensaje, el
// nombre como protagonista, el día discreto y el versículo. Sin logo y sin grandes superficies de color: el color del tipo queda en los
// detalles (pedido del responsable). Cada estilo (§9) pone su fondo, su marco de foto y su separador.
import { computed } from 'vue'
import { accentInk, mixColors } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import Festive from '../parts/Festive.vue'
import Fleuron from '../parts/Fleuron.vue'
import FramedPhoto from '../parts/FramedPhoto.vue'
import HimnarioCover from '../parts/HimnarioCover.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import { CLOTH_OPACITY } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { singleSlots } from './single'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'birthday-single' }>; ctx: SlideContext }>()

const LINES = 0.09
const RULE_X = 652
const RIGHT = { x: 716, width: 1824 - 716 }
const BOTTOM = 1000
const ORNAMENT = 64
// Arte de la izquierda: globos grandes (caja 100 × 160 escalada) con el gorrito o el pastel al pie, o
// la foto con el gorrito asentado encima del marco.
const BALLOONS = { x: 110, y: 88, width: 450, height: 720 }
const HAT = { x: 384, y: 772, width: 190, height: 247 }
const CAKE = { x: 300, y: 742, width: 290, height: 319 }
const PHOTO = { x: 150, y: 250, width: 430, height: 620 }
// El gorrito apoya su base (y = 124/130 de su caja) 14 px dentro del borde superior del marco.
const HAT_SIZE = { width: 160, height: 208 }
const hatOn = (centerX: number) => ({ ...HAT_SIZE, x: centerX - HAT_SIZE.width / 2, y: PHOTO.y + 14 - (HAT_SIZE.height * 124) / 130 })
const CORNERS = ['tl', 'tr', 'bl', 'br'] as const

const palette = computed(() => props.spec.palette)
const style = computed(() => props.spec.slideStyle)
const ground = computed(() => {
  const p = palette.value
  if (style.value === 'himnario') return texturedStops(p.background, p.text, CLOTH_OPACITY)
  if (style.value === 'almanaque') return texturedStops(p.background, p.text, LINES)
  return [...p.background]
})
const ink = computed(() => accentInk(palette.value.accent, ground.value, palette.value.text))
const soft = computed(() => mixColors(palette.value.accent, palette.value.background[0]!, 0.35))
const photo = computed(() => props.spec.person.photoId)
const slots = computed(() => singleSlots(RIGHT, { top: 112, bottom: BOTTOM, withDayLine: !!props.spec.dayText, withVerse: !!props.spec.verse, ornament: ORNAMENT }))
const frame = computed(() => {
  // En el arco el gorrito va en la cima, al centro; en los marcos rectos, cerca de la esquina izquierda.
  if (style.value === 'himnario') return { shape: 'arch' as const, border: palette.value.accent, width: 8, rotate: 0, hat: hatOn(PHOTO.x + PHOTO.width / 2), hatTurn: -8 }
  if (style.value === 'almanaque') return { shape: 'rect' as const, border: '#fbfaf6', width: 16, rotate: 2.5, hat: hatOn(PHOTO.x + 110), hatTurn: -14 }
  return { shape: 'rect' as const, border: soft.value, width: 10, rotate: -2, hat: hatOn(PHOTO.x + 110), hatTurn: -16 }
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <template v-if="style === 'himnario'">
      <HimnarioCover :palette="palette" />
      <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
        <path :d="`M${RULE_X} 120V${BOTTOM - 16}M${RULE_X + 10} 120V${BOTTOM - 16}`" :stroke="palette.accent" stroke-width="1.5" opacity="0.7" />
      </svg>
    </template>
    <Texture v-else-if="style === 'almanaque'" kind="renglones" :ink="palette.text" :opacity="LINES" />

    <template v-if="photo">
      <FramedPhoto :image-id="photo" :box="PHOTO" :shape="frame.shape" :border="frame.border" :border-width="frame.width" :rotate="frame.rotate" :load-image="ctx.loadImage" />
      <Festive kind="gorro" :box="frame.hat" :palette="palette" :rotate="frame.hatTurn" />
    </template>
    <template v-else>
      <Festive kind="globos" :box="BALLOONS" :palette="palette" />
      <!-- El Almanaque lleva pastel; los otros, gorrito. -->
      <Festive v-if="style === 'almanaque'" kind="pastel" :box="CAKE" :palette="palette" :variant="1" />
      <Festive v-else kind="gorro" :box="HAT" :palette="palette" :rotate="12" />
    </template>
    <Festive kind="confeti" :corners="CORNERS" :palette="palette" :variant="2" />

    <template v-if="slots.ornamentY !== undefined">
      <Fleuron v-if="style === 'himnario'" :box="{ x: RIGHT.x, y: slots.ornamentY, width: 264, height: 44 }" :color="palette.accent" />
      <svg v-else aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
        <path
          :d="`M${RIGHT.x} ${slots.ornamentY + 22}H${style === 'almanaque' ? RIGHT.x + RIGHT.width : RIGHT.x + 320}`"
          :stroke="style === 'almanaque' ? palette.accent : soft"
          :stroke-width="style === 'almanaque' ? 4 : 6"
          :stroke-dasharray="style === 'almanaque' ? '5 15' : undefined"
          stroke-linecap="round"
        />
      </svg>
    </template>

    <div :data-bg="ground.join(',')">
      <div :style="{ color: ink }">
        <SlideText :slot="slots.message" :text="spec.message" :font-family="palette.fontFamily" />
      </div>
      <SlideText :slot="slots.name" :text="spec.person.name" :font-family="palette.fontFamily" />
      <SlideText v-if="slots.day && spec.dayText" :slot="slots.day" :text="spec.dayText" :font-family="palette.fontFamily" />
      <SlideText v-if="slots.verse && spec.verse" :slot="slots.verse" :text="spec.verse" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
