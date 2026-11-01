<script setup lang="ts">
// Textura de fondo (tela de tapa, renglones de cuaderno o trama de puntos de imprenta).
import { useId } from 'vue'
import type { Rect } from '../../engine'
import type { TextureKind } from './texture'

withDefaults(defineProps<{ kind: TextureKind; ink: string; opacity: number; box?: Rect; clip?: string }>(), {
  box: () => ({ x: 0, y: 0, width: 1920, height: 1080 }),
  clip: undefined,
})
const id = useId()
</script>

<template>
  <svg
    aria-hidden="true"
    :width="box.width"
    :height="box.height"
    :style="{ position: 'absolute', left: `${box.x}px`, top: `${box.y}px`, pointerEvents: 'none' }"
  >
    <defs>
      <pattern v-if="kind === 'tela'" :id="id" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 2.5h5M5 7.5h5" :stroke="ink" stroke-width="1.6" />
        <path d="M2.5 5v5M7.5 0v5" :stroke="ink" stroke-width="1.6" />
      </pattern>
      <pattern v-else-if="kind === 'renglones'" :id="id" width="16" height="58" patternUnits="userSpaceOnUse">
        <path d="M0 57h16" :stroke="ink" stroke-width="2" />
      </pattern>
      <pattern v-else :id="id" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
        <circle cx="13" cy="13" r="6.5" :fill="ink" />
      </pattern>
    </defs>
    <polygon v-if="clip" :points="clip" :fill="`url(#${id})`" :opacity="opacity" />
    <rect v-else width="100%" height="100%" :fill="`url(#${id})`" :opacity="opacity" />
  </svg>
</template>
