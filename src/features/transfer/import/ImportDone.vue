<script setup lang="ts">
// Hecho: qué se importó y el enlace para abrirlo (la presentación o el primer anuncio).
import { computed } from 'vue'
import { importSummary, type ImportResult } from '../../../data/transfer/apply'
import UiBanner from '../../../ui/UiBanner.vue'
import UiButton from '../../../ui/UiButton.vue'

const props = defineProps<{ result: ImportResult }>()
const open = computed(() =>
  props.result.presentationId
    ? { label: 'Abrir la presentación', to: { name: 'presentacion', params: { id: props.result.presentationId } } }
    : { label: 'Abrir el anuncio', to: { name: 'editar', params: { id: props.result.announcementIds[0]! } } },
)
</script>

<template>
  <div class="flex max-w-xl flex-col items-start gap-4">
    <UiBanner tone="success">{{ importSummary(result) }}</UiBanner>
    <UiButton variant="primary" :to="open.to">{{ open.label }}</UiButton>
  </div>
</template>
