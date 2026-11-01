<script setup lang="ts">
// Lienzo de 1920×1080 escalado a su contenedor. Es el mismo en vista previa,
// miniaturas y ventana pública (§8.2).
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { DEFAULT_FONT_FAMILY } from '../fonts-family'
import { CANVAS, computeScale } from './canvas'

const props = withDefaults(defineProps<{ fontFamily?: string }>(), {
  fontFamily: DEFAULT_FONT_FAMILY,
})

const frame = ref<HTMLElement | null>(null)
const size = ref({ width: 0, height: 0 })
let observer: ResizeObserver | undefined

onMounted(() => {
  const el = frame.value!
  const update = () => {
    size.value = { width: el.clientWidth, height: el.clientHeight }
  }
  update()
  observer = new ResizeObserver(update)
  observer.observe(el)
})

onBeforeUnmount(() => observer?.disconnect())

const canvasStyle = computed(() => {
  const { scale, offsetX, offsetY } = computeScale(size.value.width, size.value.height)
  return {
    width: `${CANVAS.width}px`,
    height: `${CANVAS.height}px`,
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
    '--slide-font-family': `"${props.fontFamily}", sans-serif`,
  }
})
</script>

<template>
  <div ref="frame" class="slide-frame">
    <div class="slide-canvas" :style="canvasStyle">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.slide-frame {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slide-canvas {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  overflow: hidden;
  font-family: var(--slide-font-family);
}
</style>
