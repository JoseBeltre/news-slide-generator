<script setup lang="ts">
// Etiquetas de estado de un anuncio en las listas: solo lo que pide atención, Borrador o No cabe.
// "Listo" y "Pasado" no llevan nada (Pasado ya se ve en el filtro de la lista).
import { computed } from 'vue'
import type { Announcement } from '../../../data/models'
import UiBadge from '../../../ui/UiBadge.vue'

const props = defineProps<{ announcement: Pick<Announcement, 'status'> }>()

const badge = computed(() => {
  if (props.announcement.status === 'borrador') return { label: 'Borrador', tone: 'warning' as const }
  if (props.announcement.status === 'no_cabe') return { label: 'No cabe', tone: 'danger' as const }
  return null
})
</script>

<template>
  <UiBadge v-if="badge" :tone="badge.tone">{{ badge.label }}</UiBadge>
</template>
