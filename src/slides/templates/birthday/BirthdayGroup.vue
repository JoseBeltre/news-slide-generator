<script setup lang="ts">
// Cumpleaños en grupo (RF-22, RF-25): banderines y el mensaje arriba, y los nombres como
// protagonistas en tarjetas (hasta 6) o en lista de 2 columnas (7–8), con el día discreto. Sin logo ni
// fotos y sin grandes superficies de color: el color del tipo queda en los detalles (pedido del
// responsable). Cada estilo (§9) viste las celdas: Himnario con filetes, Almanaque como papel con
// costura, Cartel con raya y filete.
import { computed } from 'vue'
import { monthName } from '../../../lib/format'
import { accentInk, mixColors } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import Festive from '../parts/Festive.vue'
import HimnarioCover from '../parts/HimnarioCover.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import { CLOTH_OPACITY } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { GROUP, cellLayout, groupCells, headingSlot, pageSlot } from './geometry'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'birthday-group' }>; ctx: SlideContext }>()

const LINES = 0.09
/** Papel de las tarjetas del Almanaque: el fondo apenas aclarado u oscurecido. */
const PAPER = 0.07

const palette = computed(() => props.spec.palette)
const style = computed(() => props.spec.slideStyle)
const ground = computed(() => {
  const p = palette.value
  if (style.value === 'himnario') return texturedStops(p.background, p.text, CLOTH_OPACITY)
  if (style.value === 'almanaque') return texturedStops(p.background, p.text, LINES)
  return [...p.background]
})
const ink = computed(() => accentInk(palette.value.accent, ground.value, palette.value.text))
const paper = computed(() => palette.value.background.map((s) => mixColors(s, palette.value.text, PAPER)))
const paperInk = computed(() => accentInk(palette.value.accent, paper.value, palette.value.text))
const soft = computed(() => mixColors(palette.value.accent, palette.value.background[0]!, 0.35))

const layout = computed(() => props.spec.layout)
const onPaper = computed(() => style.value === 'almanaque' && layout.value === 'tarjetas')
const cells = computed(() => {
  const rects = groupCells(props.spec.people.length, layout.value, !!props.spec.page)
  return props.spec.people.map((person, i) => {
    const cell = rects[i]!
    // En la lista el día va corto ("7 NOV"); en la tarjeta, completo ("7 de noviembre").
    const label = layout.value === 'lista' ? `${person.day} ${monthName(person.month, true)}` : person.dayText
    return { person, cell, label, mid: 0, ...cellLayout(cell, i, layout.value, !!person.dayText) }
  }).map((c) => ({ ...c, mid: c.name.box.y + c.name.box.height / 2 }))
})
const heading = computed(() => headingSlot(style.value === 'himnario' ? 'center' : 'left'))
const page = pageSlot()
const pageText = computed(() => (props.spec.page ? `(${props.spec.page[0]}/${props.spec.page[1]})` : ''))
const rect = (r: { x: number; y: number; width: number; height: number }) => ({
  position: 'absolute' as const,
  left: `${r.x}px`,
  top: `${r.y}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
})
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <HimnarioCover v-if="style === 'himnario'" :palette="palette" />
    <Texture v-else-if="style === 'almanaque'" kind="renglones" :ink="palette.text" :opacity="LINES" />
    <!-- Cartel: un filete diagonal en el borde izquierdo, del color del tipo apagado, fuera de los nombres. -->
    <svg v-else aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <polygon points="52,0 76,0 20,1080 -4,1080" :fill="soft" opacity="0.6" />
    </svg>

    <Festive v-if="style !== 'himnario'" kind="banderines" :box="GROUP.bunting" :palette="palette" />
    <Festive kind="confeti" :box="{ x: 1480, y: 100, width: 300, height: 140 }" :palette="palette" :variant="1" />
    <Festive v-if="style === 'himnario'" kind="confeti" :box="{ x: 140, y: 100, width: 300, height: 140 }" :palette="palette" :variant="2" />

    <template v-for="c in cells" :key="c.name.id">
      <template v-if="onPaper">
        <div aria-hidden="true" :style="{ ...rect(c.cell), background: paper[0], borderRadius: '10px' }" />
        <div aria-hidden="true" :style="{ ...rect({ ...c.cell, height: 8 }), background: soft, borderRadius: '10px 10px 0 0' }" />
      </template>
      <svg v-else aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
        <template v-if="layout === 'tarjetas'">
          <template v-if="style === 'himnario'">
            <rect :x="c.cell.x" :y="c.cell.y" :width="c.cell.width" :height="c.cell.height" fill="none" :stroke="palette.accent" stroke-width="2" />
            <rect :x="c.cell.x + 8" :y="c.cell.y + 8" :width="c.cell.width - 16" :height="c.cell.height - 16" fill="none" :stroke="palette.accent" stroke-width="1" opacity="0.6" />
          </template>
          <rect v-else :x="c.cell.x" :y="c.cell.y + c.cell.height - 5" :width="c.cell.width" height="5" :fill="soft" />
        </template>
        <template v-else>
          <path
            :d="`M${c.cell.x} ${c.cell.y + c.cell.height - 2}H${c.cell.x + c.cell.width}`"
            :stroke="style === 'cartel' ? soft : palette.accent"
            :stroke-width="style === 'cartel' ? 4 : 1.5"
            :stroke-dasharray="style === 'almanaque' ? '5 13' : undefined"
            stroke-linecap="round"
          />
          <polygon v-if="style === 'himnario'" :points="`${c.cell.x + 9},${c.mid - 9} ${c.cell.x + 18},${c.mid} ${c.cell.x + 9},${c.mid + 9} ${c.cell.x},${c.mid}`" :fill="palette.accent" />
          <rect v-else :x="c.cell.x" :y="c.mid - 4" width="24" height="8" rx="4" :fill="soft" />
        </template>
      </svg>
    </template>

    <div :data-bg="ground.join(',')">
      <div :style="{ color: ink }">
        <SlideText :slot="heading" :text="spec.message" :font-family="palette.fontFamily" />
      </div>
      <SlideText v-if="spec.page" :slot="page" :text="pageText" :font-family="palette.fontFamily" />
    </div>
    <div :data-bg="(onPaper ? paper : ground).join(',')">
      <template v-for="c in cells" :key="c.name.id">
        <SlideText :slot="c.name" :text="c.person.name" :font-family="palette.fontFamily" />
        <div v-if="c.day && c.label" :style="{ color: onPaper ? paperInk : ink }">
          <SlideText :slot="c.day" :text="c.label" :font-family="palette.fontFamily" />
        </div>
      </template>
    </div>
  </SlideBackground>
</template>
