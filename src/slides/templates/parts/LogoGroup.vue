<script setup lang="ts">
// Logos de la slide (RF-37, v1.4): de 1 a 3 ministerios repartidos en partes iguales de la caja,
// en el orden elegido. Cada uno escoge su variante según el fondo y el ancho de su parte, así dos o
// tres logos juntos pasan solos a su versión vertical o a su isotipo. Sin logos no deja hueco.
import { computed } from 'vue'
import type { LogoSelection, Ministry } from '../../../data/models'
import { logoGroupFor } from '../../../data/ministries'
import type { Rect } from '../../engine'
import LogoSlot from './LogoSlot.vue'

const props = withDefaults(
  defineProps<{
    selection: LogoSelection
    ministries: readonly Ministry[]
    background: readonly string[]
    box: Rect
    cover?: boolean
    align?: 'start' | 'center' | 'end'
    /** Color del filete entre logos; sin él, solo aire. */
    divider?: string
    loadImage: (imageId: string) => Promise<Blob | undefined>
  }>(),
  { cover: false, align: 'end', divider: undefined },
)

// Con tres logos el aire se reduce: el vertical de la iglesia (1,35:1) mide ~121 px de ancho a 90 px
// de alto, así que tres caben en cajas desde ~420 px (las de las plantillas miden 464–484).
const gapFor = (n: number) => (n >= 3 ? 24 : 48)

const parts = computed(() => {
  const groups = logoGroupFor(props.selection, props.ministries)
  const n = groups.length
  const gap = gapFor(n)
  const width = (props.box.width - gap * (n - 1)) / Math.max(1, n)
  return groups.map((candidates, i) => ({
    candidates,
    box: { ...props.box, x: props.box.x + i * (width + gap), width },
  }))
})
const dividers = computed(() => {
  const gap = gapFor(parts.value.length)
  return props.divider ? parts.value.slice(1).map((p) => ({ x: p.box.x - gap / 2 - 1, y: p.box.y + p.box.height * 0.2, height: p.box.height * 0.6 })) : []
})
</script>

<template>
  <template v-for="(p, i) in parts" :key="i">
    <LogoSlot
      :candidates="p.candidates"
      :ministries="ministries"
      :background="background"
      :box="p.box"
      :cover="cover"
      :align="parts.length > 1 ? 'center' : align"
      :load-image="loadImage"
    />
  </template>
  <div
    v-for="d in dividers"
    :key="d.x"
    aria-hidden="true"
    :style="{ position: 'absolute', left: `${d.x}px`, top: `${d.y}px`, width: '2px', height: `${d.height}px`, background: divider }"
  />
</template>
