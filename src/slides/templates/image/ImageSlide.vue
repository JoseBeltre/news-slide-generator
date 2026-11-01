<script setup lang="ts">
// Slide de imagen (RF-40, RF-41): el flyer completo, sin recortes ni texto encima. Si no es 16:9, el
// espacio que sobra lo llena la misma imagen difuminada y oscurecida, nunca barras negras (§10.8).
import { computed, ref, toRef } from 'vue'
import { CANVAS } from '../../engine'
import { useImageUrl } from '../../useImageUrl'
import type { SlideContext, SlideSpec } from '../contract'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'image' }>; ctx: SlideContext }>()

const src = useImageUrl(toRef(() => props.spec.imageId), props.ctx.loadImage)

// Tamaño "contain" calculado al cargar: así la caja del elemento es la imagen misma (y se puede medir).
const natural = ref<{ width: number; height: number }>()
function onLoad(event: Event) {
  const img = event.target as HTMLImageElement
  natural.value = { width: img.naturalWidth, height: img.naturalHeight }
}
const sharpStyle = computed(() => {
  if (!natural.value) return { visibility: 'hidden' as const }
  const scale = Math.min(CANVAS.width / natural.value.width, CANVAS.height / natural.value.height)
  const width = natural.value.width * scale
  const height = natural.value.height * scale
  return { left: `${(CANVAS.width - width) / 2}px`, top: `${(CANVAS.height - height) / 2}px`, width: `${width}px`, height: `${height}px` }
})
</script>

<template>
  <div :style="{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden' }">
    <template v-if="src">
      <img
        :src="src"
        alt=""
        data-image="relleno"
        :style="{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(48px) brightness(0.55)', transform: 'scale(1.1)' }"
      />
      <img :src="src" alt="" data-image="nitida" :style="{ position: 'absolute', display: 'block', ...sharpStyle }" @load="onLoad" />
    </template>
  </div>
</template>
