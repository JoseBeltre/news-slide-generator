<script setup lang="ts">
// Vista previa real de la slide (o slides: un cumpleaños puede dar varias). Emite el peor estado:
// "no cabe" antes que "midiendo", y "midiendo" antes que "ok".
import { reactive, watch } from 'vue'
import type { SlideContext, SlideSpec, SlideStatus } from '../../../../slides/templates/contract'
import SlideView from '../../../../slides/templates/SlideView.vue'
import { useFadeOnChange } from './useFadeOnChange'

const props = defineProps<{ slides: SlideSpec[]; ctx: SlideContext }>()
const emit = defineEmits<{ status: [status: SlideStatus] }>()

/** Estilo, plantilla y colores de lo que se ve: si cambian, la vista previa se funde. */
const look = () =>
  props.slides
    .map((s) => ('palette' in s ? `${'templateId' in s ? s.templateId : s.kind}|${s.slideStyle}|${JSON.stringify(s.palette)}` : s.kind))
    .join('/')
const dim = useFadeOnChange(look)
const statuses = reactive(new Map<number, SlideStatus>())
const RANK = { no_cabe: 2, midiendo: 1, ok: 0 } as const

function emitWorst() {
  const list = props.slides.map((_, i) => statuses.get(i) ?? { status: 'midiendo' as const, offendingFields: [] })
  const worst = list.reduce<SlideStatus>((w, s) => (RANK[s.status] > RANK[w.status] ? s : w), { status: 'ok', offendingFields: [] })
  const fields = [...new Set(list.filter((s) => s.status === 'no_cabe').flatMap((s) => s.offendingFields))]
  emit('status', worst.status === 'no_cabe' ? { ...worst, offendingFields: fields } : worst)
}

function onStatus(i: number, s: SlideStatus) {
  statuses.set(i, s)
  emitWorst()
}

watch(
  () => props.slides.length,
  (n) => {
    for (const i of [...statuses.keys()]) if (i >= n) statuses.delete(i)
    emitWorst()
  },
  { immediate: true },
)
</script>

<template>
  <div data-preview class="flex flex-col gap-3">
    <figure v-for="(spec, i) in slides" :key="i" class="flex flex-col gap-1">
      <div :class="['aspect-video overflow-hidden rounded-md border border-hairline bg-surface transition-opacity ease-out motion-reduce:duration-100', dim ? 'opacity-50 duration-90' : 'opacity-100 duration-200']">
        <SlideView :spec="spec" :ctx="ctx" @status="onStatus(i, $event)" />
      </div>
      <figcaption v-if="slides.length > 1" class="font-meta text-meta text-ink-muted">Slide {{ i + 1 }}/{{ slides.length }}</figcaption>
    </figure>
    <div
      v-if="!slides.length"
      class="flex aspect-video items-center justify-center rounded-md border border-dashed border-hairline px-6 text-center text-sm text-ink-muted"
    >
      Completa los datos para ver la slide.
    </div>
  </div>
</template>
