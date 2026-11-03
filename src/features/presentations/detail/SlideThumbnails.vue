<script setup lang="ts">
// Miniaturas de todas las slides con el conteo (RF-54). Emite el peor estado medido por anuncio:
// con la fecha de la presentación, un anuncio guardado como "listo" puede no caber (cumpleaños, fechas relativas).
import { reactive, watch } from 'vue'
import type { PresentationSlide } from '../../../data/presentations'
import type { SlideContext, SlideStatus } from '../../../slides/templates/contract'
import SlideThumb from './SlideThumb.vue'

const props = defineProps<{ slides: PresentationSlide[]; ctx: SlideContext; count: string }>()
const emit = defineEmits<{ measured: [measured: ReadonlyMap<string, SlideStatus['status']>] }>()

const byIndex = reactive(new Map<number, SlideStatus['status']>())
const RANK = { no_cabe: 2, midiendo: 1, ok: 0 } as const

function emitMeasured() {
  const worst = new Map<string, SlideStatus['status']>()
  props.slides.forEach(({ announcementId }, i) => {
    if (!announcementId) return
    const s = byIndex.get(i) ?? 'midiendo'
    const prev = worst.get(announcementId)
    if (!prev || RANK[s] > RANK[prev]) worst.set(announcementId, s)
  })
  emit('measured', worst)
}

function onStatus(i: number, s: SlideStatus['status']) {
  if (byIndex.get(i) === s) return
  byIndex.set(i, s)
  emitMeasured()
}

watch(() => props.slides.length, (n) => {
  for (const i of [...byIndex.keys()]) if (i >= n) byIndex.delete(i)
})
</script>

<template>
  <section aria-labelledby="miniaturas-titulo" class="flex flex-col gap-3">
    <h2 id="miniaturas-titulo" class="font-meta text-meta uppercase text-ink-muted">{{ count }}</h2>
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-3">
      <SlideThumb
        v-for="(s, i) in slides"
        :key="`${s.announcementId ?? 'marco'}-${i}`"
        :spec="s.spec"
        :ctx="ctx"
        :announcement-id="s.announcementId"
        :number="i + 1"
        @status="onStatus(i, $event)"
      />
    </div>
  </section>
</template>
