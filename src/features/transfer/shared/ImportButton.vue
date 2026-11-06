<script setup lang="ts">
// Importar (RF-112): elegir un .zip exportado, leerlo y llevar a la revisión. Si no es nuestro, la
// revisión muestra el error. Con `icon`, solo el ícono (título de página en el celular). Mientras lee el
// archivo muestra el spinner, y si no se puede abrir avisa con "Reintentar".
import { Upload } from '@lucide/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { TransferFormatError } from '../../../data/transfer/format'
import { readTransferFile } from '../../../data/transfer/unpack'
import UiButton from '../../../ui/UiButton.vue'
import { useBusy } from '../../../ui/useBusy'
import { setPendingImport } from './pendingImport'

const props = withDefaults(defineProps<{ label?: string; icon?: boolean }>(), { label: 'Importar' })
const router = useRouter()
const { state, run } = useBusy()
const input = ref<HTMLInputElement | null>(null)

/** Abre el selector de archivos ("Reintentar" del aviso de error de la importación). */
defineExpose({ open: () => input.value?.click() })

async function read(file: File) {
  try {
    setPendingImport({ bundle: await readTransferFile(file) })
  } catch (e) {
    setPendingImport({ error: e instanceof TransferFormatError ? e.message : 'No se pudo leer el archivo.' })
  }
  await router.push({ name: 'importar' })
}

async function pick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) await run(() => read(file))
}
</script>

<template>
  <!-- Con `icon`: en el celular solo el ícono; desde md, con texto. -->
  <UiButton as="label" :busy="state" :class="icon && 'max-md:size-11 max-md:px-0'">
    <Upload :size="icon ? 20 : 16" aria-hidden="true" class="md:size-4" />
    <span :class="icon && 'max-md:sr-only'">{{ label }}</span>
    <input ref="input" type="file" accept=".zip,application/zip" :aria-label="icon ? 'Importar anuncio' : undefined" class="sr-only" @change="pick" />
  </UiButton>
</template>
