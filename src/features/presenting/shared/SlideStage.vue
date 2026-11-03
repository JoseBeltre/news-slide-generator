<script setup lang="ts">
// Escenario de proyección (RF-61, RF-68): todas las slides montadas y apiladas en un 16:9 sobre
// negro; cambiar de slide solo cambia la opacidad (fundido de 300 ms, < 100 ms en reaccionar).
import type { PresentationSlide } from '../../../data/presentations'
import type { PresenterState } from '../../../data/presenting'
import type { SlideContext } from '../../../slides/templates/contract'
import SlideView from '../../../slides/templates/SlideView.vue'
import LogoScreen from './LogoScreen.vue'

defineProps<{ slides: PresentationSlide[]; ctx: SlideContext; state: PresenterState; waiting?: boolean }>()

const LAYER = 'absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none'
</script>

<template>
  <div
    data-stage
    :data-index="state.index"
    :data-black="waiting || state.black || undefined"
    class="flex size-full items-center justify-center overflow-hidden bg-black"
  >
    <div class="relative aspect-video w-[min(100%,calc(100dvh*16/9))]">
      <div
        v-for="(s, i) in slides"
        :key="`${s.announcementId ?? 'marco'}-${i}`"
        :data-stage-slide="i"
        :aria-hidden="i !== state.index"
        :class="[LAYER, i === state.index ? 'opacity-100' : 'opacity-0']"
      >
        <SlideView :spec="s.spec" :ctx="ctx" />
      </div>
      <div :class="[LAYER, 'bg-black', waiting || state.black ? 'opacity-100' : 'pointer-events-none opacity-0']" />
      <LogoScreen v-if="state.logo && !waiting" :ministries="ctx.ministries" :class="LAYER" />
    </div>
  </div>
</template>
