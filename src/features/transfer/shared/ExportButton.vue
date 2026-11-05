<script setup lang="ts">
// Exportar un anuncio o una presentación a un .zip (RF-112). En una fila va como ícono; en un
// encabezado, como botón con texto.
import { Download } from '@lucide/vue'
import { ref } from 'vue'
import { exportAnnouncement, exportPresentation } from '../../../data/transfer/pack'
import { useDb } from '../../../data/useDb'
import UiButton from '../../../ui/UiButton.vue'
import UiIconButton from '../../../ui/UiIconButton.vue'
import { downloadBlob } from './download'

const props = defineProps<{ kind: 'anuncio' | 'presentacion'; id: string; label?: string; icon?: boolean }>()
const db = useDb()
const failed = ref(false)
const busy = ref(false)

async function run() {
  if (busy.value) return
  busy.value = true
  try {
    const file = await (props.kind === 'anuncio' ? exportAnnouncement(db, props.id) : exportPresentation(db, props.id))
    downloadBlob(file.name, file.blob)
    failed.value = false
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <UiIconButton v-if="icon" :label="label ?? 'Exportar'" :icon="Download" @click="run" />
    <UiButton v-else :disabled="busy" @click="run"><Download :size="16" aria-hidden="true" />Exportar</UiButton>
    <span v-if="failed" role="alert" class="text-sm text-danger">No se pudo exportar.</span>
  </span>
</template>
