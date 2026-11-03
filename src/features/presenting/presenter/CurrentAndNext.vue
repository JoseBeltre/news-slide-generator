<script setup lang="ts">
// La slide que se proyecta, grande, y la siguiente, pequeña (RF-63). Al final, "Fin".
import type { PresentationSlide } from '../../../data/presentations'
import type { SlideContext } from '../../../slides/templates/contract'
import SlideView from '../../../slides/templates/SlideView.vue'

defineProps<{ current?: PresentationSlide; next?: PresentationSlide; ctx: SlideContext; black: boolean; logo: boolean }>()
</script>

<template>
  <div class="grid gap-4 md:grid-cols-[3fr_1fr] md:items-end">
    <figure class="flex flex-col gap-1">
      <div class="relative aspect-video overflow-hidden rounded-md border border-hairline bg-black">
        <SlideView v-if="current" :spec="current.spec" :ctx="ctx" />
        <div v-if="black || logo" class="absolute inset-0 flex items-center justify-center bg-black/80 font-meta text-meta uppercase text-white">
          {{ black ? 'En negro' : 'Logo' }}
        </div>
      </div>
      <figcaption class="font-meta text-meta uppercase text-ink-muted">Ahora</figcaption>
    </figure>
    <figure class="flex flex-col gap-1">
      <div class="flex aspect-video items-center justify-center overflow-hidden rounded-md border border-hairline bg-black text-ink-muted">
        <SlideView v-if="next" :spec="next.spec" :ctx="ctx" />
        <span v-else class="font-meta text-meta uppercase">Fin</span>
      </div>
      <figcaption class="font-meta text-meta uppercase text-ink-muted">Siguiente</figcaption>
    </figure>
  </div>
</template>
