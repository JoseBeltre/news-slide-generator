<script setup lang="ts">
// Tira de miniaturas (RF-62): la actual marcada; tocar una salta a ella.
import type { PresentationSlide } from '../../../data/presentations'
import type { SlideContext } from '../../../slides/templates/contract'
import SlideView from '../../../slides/templates/SlideView.vue'

defineProps<{ slides: PresentationSlide[]; ctx: SlideContext; current: number }>()
defineEmits<{ go: [index: number] }>()
</script>

<template>
  <ol aria-label="Slides" class="flex gap-2 overflow-x-auto pb-2">
    <li v-for="(s, i) in slides" :key="`${s.announcementId ?? 'marco'}-${i}`" class="w-40 shrink-0">
      <button
        type="button"
        :aria-label="`Ir a la slide ${i + 1}`"
        :aria-current="i === current ? 'step' : undefined"
        :class="[
          'block aspect-video w-full cursor-pointer overflow-hidden rounded-sm border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
          i === current ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100',
        ]"
        @click="$emit('go', i)"
      >
        <SlideView :spec="s.spec" :ctx="ctx" />
      </button>
      <span class="font-meta text-meta text-ink-muted">{{ i + 1 }}</span>
    </li>
  </ol>
</template>
