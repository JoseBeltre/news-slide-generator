<script setup lang="ts">
// Importar (RF-112): sin archivo pide uno; con un archivo inválido lo dice; si no, la revisión y, al
// terminar, el resumen con el enlace a lo importado.
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import UiEmptyState from '../../../ui/UiEmptyState.vue'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import { notify } from '../../../ui/useSnackbar'
import ImportButton from '../shared/ImportButton.vue'
import ImportDone from './ImportDone.vue'
import ImportReview from './ImportReview.vue'
import { useImport } from './useImport'

const router = useRouter()
const imp = useImport()
const { plan, error, errorTick, done, applying, loaded } = imp
const importer = ref<InstanceType<typeof ImportButton> | null>(null)
// Un fallo (archivo inválido, no se pudo preparar o aplicar) sale como aviso de error con "Reintentar":
// aplicar de nuevo si hay una revisión abierta; si no, elegir otro archivo.
watch(
  errorTick,
  () => {
    const message = error.value
    if (message) notify({ message, tone: 'error', action: { label: 'Reintentar', run: () => (plan.value ? imp.apply() : importer.value?.open()) } })
  },
  { immediate: true },
)
const cancel = () => (window.history.state?.back ? router.back() : router.push({ name: 'anuncios' }))
</script>

<template>
  <UiPageHeader title="Importar" />
  <ImportDone v-if="done" :result="done" />
  <div v-else-if="plan" class="flex flex-col gap-4">
    <ImportReview
      :plan="plan"
      :applying="applying"
      @resolution="imp.setResolution"
      @toggle="imp.toggle"
      @presentation-resolution="imp.setPresentationResolution"
      @target-date="imp.setTargetDate"
      @confirm="imp.apply"
      @cancel="cancel"
    />
  </div>
  <UiEmptyState v-else-if="loaded" message="Elige un archivo exportado de Anuncios del Sábado.">
    <ImportButton ref="importer" />
  </UiEmptyState>
</template>
