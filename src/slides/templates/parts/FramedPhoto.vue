<script setup lang="ts">
// Foto enmarcada (cumpleaños): una foto normal, recortada para llenar su forma (arco, círculo o
// rectángulo) con un borde de color. Ningún texto la pisa (§5.5). Nada si la imagen no carga.
import { computed, toRef } from 'vue'
import type { Rect } from '../../engine'
import { useImageUrl } from '../../useImageUrl'

const props = withDefaults(
  defineProps<{
    imageId: string
    box: Rect
    shape?: 'arch' | 'circle' | 'rect'
    border?: string
    borderWidth?: number
    /** Grados; el cartel pega la foto un poco torcida. */
    rotate?: number
    loadImage: (imageId: string) => Promise<Blob | undefined>
  }>(),
  { shape: 'rect', border: undefined, borderWidth: 0, rotate: 0 },
)
const src = useImageUrl(toRef(() => props.imageId), props.loadImage)

const radius = computed(() => {
  if (props.shape === 'circle') return '50%'
  if (props.shape === 'arch') return `${props.box.width / 2}px ${props.box.width / 2}px 6px 6px`
  return '6px'
})
</script>

<template>
  <div
    v-if="src"
    aria-hidden="true"
    :style="{
      position: 'absolute',
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
      borderRadius: radius,
      background: border,
      padding: `${borderWidth}px`,
      boxSizing: 'border-box',
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      boxShadow: border ? '0 18px 40px rgba(0, 0, 0, 0.28)' : undefined,
    }"
  >
    <img
      :src="src"
      alt=""
      data-photo
      :style="{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 25%', borderRadius: radius }"
    />
  </div>
</template>
