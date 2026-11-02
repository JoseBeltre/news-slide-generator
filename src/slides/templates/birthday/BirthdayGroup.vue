<script setup lang="ts">
// Cumpleaños en grupo (RF-22, RF-25): el mensaje de cabecera, el logo y una rejilla de tarjetas del
// mismo tamaño, con el día de cada uno y su foto si la tiene. Cada estilo (§9) viste las tarjetas a su
// manera: Himnario con filetes dorados, Almanaque como hojitas de almanaque, Cartel con etiquetas de color.
import { computed } from 'vue'
import { monthName } from '../../../lib/format'
import { accentInk, mixColors } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import FramedPhoto from '../parts/FramedPhoto.vue'
import HimnarioCover from '../parts/HimnarioCover.vue'
import LogoGroup from '../parts/LogoGroup.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import { CLOTH_OPACITY, sheetSeam } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { GROUP, NAME_GAP, cardLayout, groupCards, headingSlot, pageSlot } from './geometry'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'birthday-group' }>; ctx: SlideContext }>()

const LINES = 0.09
// Cartel: banda de color arriba (la cabecera es el afiche) y un filete paralelo debajo.
const BAND = '0,0 1920,0 1920,228 0,240'
const BAND_RULE = '0,250 1920,238 1920,244 0,256'

const palette = computed(() => props.spec.palette)
const style = computed(() => props.spec.slideStyle)
/** Fondo bajo los textos que no van en tarjeta ni banda, con su textura. */
const ground = computed(() => {
  const p = palette.value
  if (style.value === 'himnario') return texturedStops(p.background, p.text, CLOTH_OPACITY)
  if (style.value === 'almanaque') return texturedStops(p.background, p.text, LINES)
  return [...p.background]
})
const gold = computed(() => accentInk(palette.value.accent, ground.value, palette.value.text))
const seam = computed(() => sheetSeam(palette.value))

const mode = computed(() => (props.spec.people.some((p) => p.photoId) ? 'photos' : 'names'))
const cards = computed(() => {
  const rects = groupCards(props.spec.people.length, mode.value === 'photos', !!props.spec.page)
  return props.spec.people.map((person, i) => {
    const card = rects[i]!
    const layout = cardLayout(card, i, mode.value, !!person.photoId)
    const tag = layout.day.box
    const tagHeight = Math.min(tag.height, 112)
    return {
      person,
      card,
      ...layout,
      day: `${person.day} ${monthName(person.month, true)}`,
      // En el Cartel la fecha va dentro de su etiqueta, con aire a los lados.
      dayBox: style.value === 'cartel' ? { ...layout.day, box: { ...tag, x: tag.x + 24, width: tag.width - 48 } } : layout.day,
      // Etiqueta del Cartel: paralelogramo del color del tipo detrás de la fecha.
      tag: (() => {
        const y = tag.y + (tag.height - tagHeight) / 2
        return `${tag.x - 10},${y + tagHeight} ${tag.x + 10},${y} ${tag.x + tag.width + 10},${y} ${tag.x + tag.width - 10},${y + tagHeight}`
      })(),
    }
  })
})
const heading = headingSlot()
const page = pageSlot()
const pageText = computed(() => (props.spec.page ? `(${props.spec.page[0]}/${props.spec.page[1]})` : ''))
const sheetShadow = '0 14px 30px rgba(0, 0, 0, 0.24)'
const box = (r: { x: number; y: number; width: number; height: number }) => ({
  position: 'absolute' as const,
  left: `${r.x}px`,
  top: `${r.y}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
})
const photoBorder = computed(() => (style.value === 'himnario' ? palette.value.accent : style.value === 'almanaque' ? palette.value.onField : palette.value.field))
const halftone = computed(() => mixColors(palette.value.field, palette.value.background[0]!, 0.15))
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <HimnarioCover v-if="style === 'himnario'" :palette="palette" />
    <Texture v-else-if="style === 'almanaque'" kind="renglones" :ink="palette.text" :opacity="LINES" />
    <svg v-else aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <polygon :points="BAND" :fill="palette.field" />
      <polygon :points="BAND_RULE" :fill="halftone" />
    </svg>

    <!-- Cabecera: el mensaje y los logos. -->
    <div v-if="style === 'cartel'" :data-bg="palette.field" :style="{ color: palette.onField }">
      <SlideText :slot="heading" :text="spec.message" :font-family="palette.fontFamily" />
      <LogoGroup :selection="spec.logo" :ministries="ctx.ministries" :background="[palette.field]" :box="GROUP.logo" :divider="palette.onField" :load-image="ctx.loadImage" />
    </div>
    <div v-else :data-bg="ground.join(',')">
      <div :style="{ color: style === 'himnario' ? gold : palette.text }">
        <SlideText :slot="heading" :text="spec.message" :font-family="palette.fontFamily" />
      </div>
      <LogoGroup :selection="spec.logo" :ministries="ctx.ministries" :background="ground" :box="GROUP.logo" :divider="palette.accent" :load-image="ctx.loadImage" />
    </div>

    <template v-for="c in cards" :key="c.dayBox.id">
      <!-- Almanaque: cada tarjeta es una hojita del color del tipo. -->
      <template v-if="style === 'almanaque'">
        <div aria-hidden="true" :style="{ ...box(c.card), background: palette.field, borderRadius: '10px', boxShadow: sheetShadow }" />
        <div aria-hidden="true" :style="{ ...box({ ...c.card, height: 10 }), background: seam, borderRadius: '10px 10px 0 0' }" />
        <svg v-if="mode === 'names'" aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
          <path
            :d="`M${c.name.box.x - NAME_GAP / 2} ${c.card.y + 26}V${c.card.y + c.card.height - 22}`"
            :stroke="seam"
            stroke-width="4"
            stroke-dasharray="4 12"
            stroke-linecap="round"
          />
        </svg>
        <FramedPhoto v-if="c.photo && c.person.photoId" :image-id="c.person.photoId" :box="c.photo" shape="circle" :border="photoBorder" :border-width="6" :load-image="ctx.loadImage" />
        <div :data-bg="palette.field" :style="{ color: palette.onField }">
          <SlideText :slot="c.dayBox" :text="c.day" :font-family="palette.fontFamily" />
          <SlideText :slot="c.name" :text="c.person.name" :font-family="palette.fontFamily" />
        </div>
      </template>

      <!-- Himnario: marco de filetes dorados, la fecha en dorado. -->
      <template v-else-if="style === 'himnario'">
        <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
          <rect :x="c.card.x" :y="c.card.y" :width="c.card.width" :height="c.card.height" fill="none" :stroke="palette.accent" stroke-width="3" />
          <rect :x="c.card.x + 8" :y="c.card.y + 8" :width="c.card.width - 16" :height="c.card.height - 16" fill="none" :stroke="palette.accent" stroke-width="1.25" />
          <path v-if="mode === 'names'" :d="`M${c.name.box.x - NAME_GAP / 2} ${c.card.y + 28}V${c.card.y + c.card.height - 28}`" :stroke="palette.accent" stroke-width="1.5" />
        </svg>
        <FramedPhoto v-if="c.photo && c.person.photoId" :image-id="c.person.photoId" :box="c.photo" shape="circle" :border="photoBorder" :border-width="5" :load-image="ctx.loadImage" />
        <div :data-bg="ground.join(',')">
          <div :style="{ color: gold }">
            <SlideText :slot="c.dayBox" :text="c.day" :font-family="palette.fontFamily" />
          </div>
          <SlideText :slot="c.name" :text="c.person.name" :font-family="palette.fontFamily" />
        </div>
      </template>

      <!-- Cartel: la fecha en una etiqueta del color del tipo y un filete al pie. -->
      <template v-else>
        <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
          <polygon :points="c.tag" :fill="palette.field" />
          <rect :x="c.card.x" :y="c.card.y + c.card.height - 6" :width="c.card.width" height="6" :fill="palette.accent" />
        </svg>
        <FramedPhoto
          v-if="c.photo && c.person.photoId"
          :image-id="c.person.photoId"
          :box="c.photo"
          shape="rect"
          :border="photoBorder"
          :border-width="8"
          :rotate="-2"
          :load-image="ctx.loadImage"
        />
        <div :data-bg="palette.field" :style="{ color: palette.onField }">
          <SlideText :slot="c.dayBox" :text="c.day" :font-family="palette.fontFamily" />
        </div>
        <div :data-bg="ground.join(',')">
          <SlideText :slot="c.name" :text="c.person.name" :font-family="palette.fontFamily" />
        </div>
      </template>
    </template>

    <div v-if="spec.page" :data-bg="ground.join(',')">
      <SlideText :slot="page" :text="pageText" :font-family="palette.fontFamily" />
    </div>
  </SlideBackground>
</template>
