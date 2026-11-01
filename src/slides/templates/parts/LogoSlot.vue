<script setup lang="ts">
// Slot de logo (RF-37…39): elige la variante según el fondo, la dibuja dentro de su caja con un alto
// de 90–160 px (portada ≤ 400) y, si ninguna variante contrasta, la pone sobre una placa.
// Con "ninguno" o sin logos no dibuja nada: la plantilla no deja hueco.
import { computed, ref, toRef } from 'vue'
import type { LogoSelection, Ministry } from '../../../data/models'
import { logoCandidatesFor, logoUrlFor } from '../../../data/ministries'
import { LOGO_HEIGHT, clampLogoHeight, selectLogoVariant, type Rect } from '../../engine'
import { useImageUrl } from '../../useImageUrl'

const props = withDefaults(
  defineProps<{
    selection: LogoSelection
    ministries: readonly Ministry[]
    background: readonly string[]
    box: Rect
    cover?: boolean
    align?: 'start' | 'center' | 'end'
    loadImage: (imageId: string) => Promise<Blob | undefined>
  }>(),
  { cover: false, align: 'end' },
)

const PLATE_PADDING = 16

const choice = computed(() => {
  const orientation = props.box.width / props.box.height >= 2 ? 'horizontal' : 'vertical'
  return selectLogoVariant(logoCandidatesFor(props.selection, props.ministries), props.background, { orientation })
})
const source = computed(() => (choice.value ? logoUrlFor(choice.value.candidate.id, props.ministries) : undefined))
const uploadedUrl = useImageUrl(
  computed(() => (source.value?.kind === 'image' ? source.value.imageId : undefined)),
  props.loadImage,
)
const src = computed(() => (source.value?.kind === 'asset' ? source.value.src : uploadedUrl.value))

const padding = computed(() => (choice.value?.plate ? PLATE_PADDING : 0))
const maxHeight = computed(() => {
  const available = props.box.height - 2 * padding.value
  return props.cover ? Math.min(available, LOGO_HEIGHT.coverMax) : clampLogoHeight(available)
})
// Alto final: el máximo, salvo que el ancho de la caja obligue a reducirlo (nunca bajo 90 px).
const height = ref<number>()
function fitWidth(event: Event) {
  const img = event.target as HTMLImageElement
  const widthAtMax = img.offsetWidth
  const availableWidth = props.box.width - 2 * padding.value
  const byWidth = widthAtMax > 0 ? (availableWidth * maxHeight.value) / widthAtMax : maxHeight.value
  height.value = Math.max(LOGO_HEIGHT.min, Math.min(maxHeight.value, byWidth))
}

const justify = { start: 'flex-start', center: 'center', end: 'flex-end' } as const
const boxStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.box.x}px`,
  top: `${props.box.y}px`,
  width: `${props.box.width}px`,
  height: `${props.box.height}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: justify[props.align],
}))
const plateStyle = computed(() =>
  choice.value?.plate ? { background: choice.value.plate, padding: `${PLATE_PADDING}px`, borderRadius: `${PLATE_PADDING}px`, display: 'flex' } : { display: 'flex' },
)
// Cambiar de variante vuelve a medir.
const key = toRef(() => src.value ?? '')
</script>

<template>
  <div v-if="choice && src" :style="boxStyle">
    <div :style="plateStyle">
      <img
        :key="key"
        :src="src"
        alt=""
        data-logo
        :data-cover="cover ? '' : undefined"
        :style="{ height: `${height ?? maxHeight}px`, width: 'auto', display: 'block' }"
        @load="fitWidth"
      />
    </div>
  </div>
</template>
