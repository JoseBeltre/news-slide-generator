<script setup lang="ts">
// Etiquetas de estado de un anuncio en las listas: borrador, no cabe, pasado. "Listo" no lleva nada.
import { computed } from 'vue'
import { isPast } from '../../../data/announcements'
import type { Announcement } from '../../../data/models'
import UiBadge from '../../../ui/UiBadge.vue'

const props = defineProps<{ announcement: Pick<Announcement, 'status' | 'eventDate'>; today: string }>()

const badges = computed(() => {
  const out: { label: string; tone: 'neutral' | 'danger' }[] = []
  if (props.announcement.status === 'borrador') out.push({ label: 'Borrador', tone: 'neutral' })
  if (props.announcement.status === 'no_cabe') out.push({ label: 'No cabe', tone: 'danger' })
  if (isPast(props.announcement, props.today)) out.push({ label: 'Pasado', tone: 'neutral' })
  return out
})
</script>

<template>
  <UiBadge v-for="b in badges" :key="b.label" :tone="b.tone">{{ b.label }}</UiBadge>
</template>
