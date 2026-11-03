<script setup lang="ts">
// Presentación del día (SRS §6.4): ordenar, agregar y quitar anuncios, portada y cierre;
// miniaturas con el conteo y "Preparar sin internet".
import { computed, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { moveItem } from '../../../data/presentations'
import { formatDate, toIsoDate } from '../../../lib/format'
import UiButton from '../../../ui/UiButton.vue'
import UiEmptyState from '../../../ui/UiEmptyState.vue'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import AddAnnouncements from './AddAnnouncements.vue'
import FrameOptions from './FrameOptions.vue'
import PresentationItems from './PresentationItems.vue'
import type { SlideStatus } from '../../../slides/templates/contract'
import { useOfflineCheck } from '../shared/useOfflineCheck'
import { usePresentationRecord } from '../shared/usePresentationRecord'
import { usePresentationSlides } from '../shared/usePresentationSlides'
import PreparePanel from './PreparePanel.vue'
import SlideThumbnails from './SlideThumbnails.vue'

const route = useRoute()
const { presentation: p, missing, byId, announcements, update } = usePresentationRecord(computed(() => String(route.params.id)))
const { base, ctx, slides, count } = usePresentationSlides(p, byId)
const measured = shallowRef<ReadonlyMap<string, SlideStatus['status']>>(new Map())
const check = computed(() => (p.value ? { presentation: p.value, byId: byId.value, ctx: base.value, measured: measured.value } : undefined))
const { report, checking, prepare } = useOfflineCheck(check)
const today = toIsoDate(new Date())
const items = computed(() => p.value?.items ?? [])
const move = (from: number, to: number) => update({ items: moveItem(items.value, from, to) })
const removeAt = (index: number) => update({ items: items.value.filter((_, i) => i !== index) })
const add = (announcementId: string) => update({ items: [...items.value, { announcementId }] })
</script>

<template>
  <UiEmptyState v-if="missing" message="Esta presentación ya no existe.">
    <UiButton :to="{ name: 'presentaciones' }">Ver presentaciones</UiButton>
  </UiEmptyState>
  <template v-else-if="p">
    <UiPageHeader :title="formatDate(p.date)" />
    <div class="grid gap-8 lg:grid-cols-[2fr_3fr] lg:items-start">
      <div class="flex flex-col gap-8">
        <PresentationItems :items="items" :by-id="byId" :today="today" @move="move" @remove="removeAt" />
        <AddAnnouncements :presentation="p" :announcements="announcements" :today="today" @add="add" />
        <FrameOptions
          :default-title="base.settings.coverTitle"
          :show-cover="p.showCover"
          :show-closing="p.showClosing"
          :cover-title="p.coverTitle"
          @update:show-cover="(v) => update({ showCover: v })"
          @update:show-closing="(v) => update({ showClosing: v })"
          @update:cover-title="(v) => update({ coverTitle: v })"
        />
      </div>
      <div class="flex flex-col gap-6 lg:sticky lg:top-6">
        <PreparePanel :report="report" :checking="checking" @prepare="prepare" />
        <SlideThumbnails :slides="slides" :ctx="ctx" :count="count" @measured="(m) => (measured = m)" />
      </div>
    </div>
  </template>
</template>
