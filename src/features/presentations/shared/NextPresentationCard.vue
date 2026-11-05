<script setup lang="ts">
// Inicio (§6.1): la presentación del próximo sábado, en columna: fecha → «N anuncios · lista sin
// internet» → Presentar a todo el ancho → una línea con el color de cada anuncio. Si aún no existe, el
// botón para crearla con los anuncios sugeridos. Las slides se miden fuera de la vista con la fecha del
// sábado: un anuncio guardado como "listo" puede no caber ese día.
import { CircleCheck, TriangleAlert } from '@lucide/vue'
import { computed, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'
import { contentIssues, nextSaturday } from '../../../data/presentations'
import { formatDate } from '../../../lib/format'
import UiButton from '../../../ui/UiButton.vue'
import type { SlideStatus } from '../../../slides/templates/contract'
import { typeVisual } from '../../announcements/shared/typeVisual'
import SlideThumbnails from './SlideThumbnails.vue'
import { useOfflineCheck } from './useOfflineCheck'
import { usePresentationRecord } from './usePresentationRecord'
import { usePresentationSlides } from './usePresentationSlides'
import { usePresentations } from './usePresentations'

const { upcoming, loaded, today, openOrCreate } = usePresentations()
const saturday = nextSaturday(today)
const id = computed(() => upcoming.value.find((p) => p.date === saturday)?.id ?? '')
const { presentation, byId } = usePresentationRecord(id)
const { base, ctx, slides, count } = usePresentationSlides(presentation, byId)
const measured = shallowRef<ReadonlyMap<string, SlideStatus['status']>>(new Map())
const { report, checking } = useOfflineCheck(
  computed(() => (presentation.value ? { presentation: presentation.value, byId: byId.value, ctx: base.value, measured: measured.value } : undefined)),
)

const items = computed(() => presentation.value?.items ?? [])
const announcementsLabel = computed(() => (items.value.length === 1 ? '1 anuncio' : `${items.value.length} anuncios`))
const measuring = computed(() => checking.value || !report.value || (report.value.issues.length > 0 && report.value.issues.every((i) => i.kind === 'midiendo')))
/** Si algo impide presentar (RF-10), el botón lleva a la presentación, donde se ve qué falta. */
const blocked = computed(() =>
  presentation.value ? contentIssues(presentation.value, byId.value, measured.value).some((i) => i.kind !== 'midiendo') : false,
)
const stripe = computed(() => items.value.map((it) => byId.value.get(it.announcementId)).map((a) => (a ? typeVisual(a.typeId).accent : 'var(--color-hairline)')))
</script>

<template>
  <section v-if="loaded" aria-label="Presentación del sábado" class="mb-8 flex flex-col gap-3.5 rounded-lg border border-hairline bg-surface p-4">
    <template v-if="presentation">
      <div>
        <RouterLink :to="{ name: 'presentacion', params: { id: presentation.id } }" class="font-display text-heading-sm text-ink hover:underline">
          {{ formatDate(presentation.date) }}
        </RouterLink>
        <p data-offline-status class="mt-1 flex items-center gap-1.5 text-[15px]/snug text-ink-muted">
          <template v-if="measuring">Comprobando…</template>
          <template v-else-if="report?.ready">
            <CircleCheck :size="16" aria-hidden="true" class="shrink-0 text-success" />{{ announcementsLabel }} · lista sin internet
          </template>
          <template v-else>
            <TriangleAlert :size="16" aria-hidden="true" class="shrink-0 text-warning" />{{ announcementsLabel }} · falta algo para usar sin internet
          </template>
        </p>
      </div>
      <UiButton variant="primary" class="w-full" :to="{ name: blocked ? 'presentacion' : 'presentar', params: { id: presentation.id } }">Presentar</UiButton>
      <div v-if="stripe.length" aria-hidden="true" class="flex gap-0.75">
        <span v-for="(color, i) in stripe" :key="i" :style="{ '--stripe': color }" class="h-1 flex-1 rounded-xs bg-(--stripe)" />
      </div>
      <div aria-hidden="true" inert class="pointer-events-none fixed top-0 -left-[200vw] w-160">
        <SlideThumbnails :slides="slides" :ctx="ctx" :count="count" @measured="(m) => (measured = m)" />
      </div>
    </template>
    <div v-else class="flex flex-wrap items-center justify-between gap-3">
      <span class="text-ink">Aún no hay presentación para el {{ formatDate(saturday).toLowerCase() }}.</span>
      <UiButton @click="openOrCreate(saturday)">Crear la presentación del sábado</UiButton>
    </div>
  </section>
</template>
