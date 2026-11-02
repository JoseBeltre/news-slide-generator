<script setup lang="ts">
// Cumpleaños en grupo (RF-22, RF-25): banderines de colores y el mensaje arriba, y los nombres como
// protagonistas en tarjetas (hasta 6) o en lista de 2 columnas (7–8), con el día discreto. Siempre en
// fondo claro, sin logo, sin fotos, sin recuadros y con los adornos en colores de fiesta variados
// (pedidos del responsable). El estilo (§9) pone la textura del fondo y el trazo del separador.
import { computed } from 'vue'
import { monthName } from '../../../lib/format'
import { accentInk, mixColors } from '../../themes'
import type { SlideContext, SlideSpec } from '../contract'
import Festive from '../parts/Festive.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'
import Texture from '../parts/Texture.vue'
import { festiveColors } from '../parts/festive'
import { CLOTH_OPACITY } from '../parts/styleParts'
import { texturedStops } from '../parts/texture'
import { GROUP, cellLayout, groupCells, headingSlot, pageSlot } from './geometry'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'birthday-group' }>; ctx: SlideContext }>()

const LINES = 0.09
const CORNERS = ['bl', 'br'] as const

const palette = computed(() => props.spec.palette)
const style = computed(() => props.spec.slideStyle)
const ground = computed(() => {
  const p = palette.value
  if (style.value === 'himnario') return texturedStops(p.background, p.text, CLOTH_OPACITY)
  if (style.value === 'almanaque') return texturedStops(p.background, p.text, LINES)
  return [...p.background]
})
const ink = computed(() => accentInk(palette.value.accent, ground.value, palette.value.text))
const colors = computed(() => festiveColors(palette.value, 1))
const rule = computed(() => mixColors(palette.value.text, palette.value.background[0]!, 0.78))

const layout = computed(() => props.spec.layout)
const cells = computed(() =>
  props.spec.people.map((person, i) => {
    const cell = groupCells(props.spec.people.length, layout.value, !!props.spec.page)[i]!
    const slots = cellLayout(cell, i, layout.value, !!person.dayText)
    // En la lista el día va corto ("7 NOV"); en la tarjeta, completo ("7 de noviembre").
    const label = layout.value === 'lista' ? `${person.day} ${monthName(person.month, true)}` : person.dayText
    return { person, cell, label, color: colors.value[i % colors.value.length]!, mid: slots.name.box.y + slots.name.box.height / 2, ...slots }
  }),
)
const heading = computed(() => headingSlot(style.value === 'himnario' ? 'center' : 'left'))
const page = pageSlot()
const pageText = computed(() => (props.spec.page ? `(${props.spec.page[0]}/${props.spec.page[1]})` : ''))
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <Texture v-if="style === 'himnario'" kind="tela" :ink="palette.text" :opacity="CLOTH_OPACITY" />
    <Texture v-else-if="style === 'almanaque'" kind="renglones" :ink="palette.text" :opacity="LINES" />

    <Festive kind="banderines" :box="GROUP.bunting" :palette="palette" />
    <Festive kind="confeti" :corners="CORNERS" :palette="palette" :variant="3" />

    <!-- Separadores sin recuadro: un trazo fino bajo cada nombre y una marca de color. -->
    <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0">
      <template v-for="c in cells" :key="c.name.id">
        <template v-if="layout === 'tarjetas'">
          <rect :x="c.cell.x + c.cell.width / 2 - 40" :y="c.cell.y + c.cell.height - 8" width="80" height="8" rx="4" :fill="c.color" />
        </template>
        <template v-else>
          <path
            :d="`M${c.cell.x} ${c.cell.y + c.cell.height - 2}H${c.cell.x + c.cell.width}`"
            :stroke="rule"
            :stroke-width="style === 'cartel' ? 3 : 2"
            :stroke-dasharray="style === 'almanaque' ? '5 13' : undefined"
            stroke-linecap="round"
          />
          <polygon v-if="style === 'himnario'" :points="`${c.cell.x + 10},${c.mid - 11} ${c.cell.x + 21},${c.mid} ${c.cell.x + 10},${c.mid + 11} ${c.cell.x - 1},${c.mid}`" :fill="c.color" />
          <circle v-else-if="style === 'almanaque'" :cx="c.cell.x + 11" :cy="c.mid" r="10" :fill="c.color" />
          <rect v-else :x="c.cell.x" :y="c.mid - 5" width="26" height="10" rx="5" :fill="c.color" />
        </template>
      </template>
    </svg>

    <div :data-bg="ground.join(',')">
      <div :style="{ color: ink }">
        <SlideText :slot="heading" :text="spec.message" :font-family="palette.fontFamily" />
      </div>
      <SlideText v-if="spec.page" :slot="page" :text="pageText" :font-family="palette.fontFamily" />
      <template v-for="c in cells" :key="c.name.id">
        <SlideText :slot="c.name" :text="c.person.name" :font-family="palette.fontFamily" />
        <div v-if="c.day && c.label" :style="{ color: ink }">
          <SlideText :slot="c.day" :text="c.label" :font-family="palette.fontFamily" />
        </div>
      </template>
    </div>
  </SlideBackground>
</template>
