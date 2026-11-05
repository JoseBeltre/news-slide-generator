<script setup lang="ts">
// Importar (RF-112): elegir un .zip exportado, leerlo y llevar a la revisión. Si no es nuestro, la
// revisión muestra el error.
import { Upload } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { TransferFormatError } from '../../../data/transfer/format'
import { readTransferFile } from '../../../data/transfer/unpack'
import UiButton from '../../../ui/UiButton.vue'
import { setPendingImport } from './pendingImport'

withDefaults(defineProps<{ label?: string }>(), { label: 'Importar' })
const router = useRouter()

async function pick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    setPendingImport({ bundle: await readTransferFile(file) })
  } catch (e) {
    setPendingImport({ error: e instanceof TransferFormatError ? e.message : 'No se pudo leer el archivo.' })
  }
  await router.push({ name: 'importar' })
}
</script>

<template>
  <UiButton as="label">
    <Upload :size="16" aria-hidden="true" />{{ label }}
    <input type="file" accept=".zip,application/zip" class="sr-only" @change="pick" />
  </UiButton>
</template>
