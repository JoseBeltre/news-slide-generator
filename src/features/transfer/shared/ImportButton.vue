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
import UiIconButton from '../../../ui/UiIconButton.vue'
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
  <UiIconButton v-if="icon" as="label" :label="props.label === 'Importar' ? 'Importar anuncio' : props.label" :icon="Upload" variant="line" :busy="state">
    <input ref="input" type="file" accept=".zip,application/zip" aria-label="Importar anuncio" class="sr-only" @change="pick" />
  </UiIconButton>
  <UiButton v-else as="label" :busy="state">
    <Upload :size="16" aria-hidden="true" />{{ label }}
    <input ref="input" type="file" accept=".zip,application/zip" class="sr-only" @change="pick" />
  </UiButton>
</template>
