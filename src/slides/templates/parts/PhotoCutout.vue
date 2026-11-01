<script setup lang="ts">
// Foto recortada (PNG sin fondo) de la plantilla Visual: de pie sobre el borde inferior de su caja,
// sin recortes. Ningún texto la pisa (§5.5): cada estilo deja su caja libre.
import { toRef } from 'vue'
import type { Rect } from '../../engine'
import { useImageUrl } from '../../useImageUrl'

const props = defineProps<{ imageId: string; box: Rect; loadImage: (imageId: string) => Promise<Blob | undefined> }>()
const src = useImageUrl(toRef(() => props.imageId), props.loadImage)
</script>

<template>
  <img
    v-if="src"
    :src="src"
    alt=""
    data-photo
    :style="{
      position: 'absolute',
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
      objectFit: 'contain',
      objectPosition: 'bottom',
    }"
  />
</template>
