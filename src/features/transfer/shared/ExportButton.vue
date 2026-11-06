<script setup lang="ts">
// Exportar un anuncio o una presentación a un .zip (RF-112), como botón con texto en un encabezado.
// En las filas de anuncios se exporta desde el menú de tres puntos (useExport).
import { Download } from '@lucide/vue'
import UiButton from '../../../ui/UiButton.vue'
import { useExport } from './useExport'

const props = defineProps<{ kind: 'anuncio' | 'presentacion'; id: string }>()
const { state, run } = useExport(props.kind, () => props.id)
</script>

<template>
  <UiButton :busy="state" @click="run"><Download :size="16" aria-hidden="true" />Exportar</UiButton>
</template>
