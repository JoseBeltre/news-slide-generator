<script setup lang="ts">
// Importar (RF-112): sin archivo pide uno; con un archivo inválido lo dice; si no, la revisión y, al
// terminar, el resumen con el enlace a lo importado.
import { useRouter } from 'vue-router'
import UiBanner from '../../../ui/UiBanner.vue'
import UiEmptyState from '../../../ui/UiEmptyState.vue'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import ImportButton from '../shared/ImportButton.vue'
import ImportDone from './ImportDone.vue'
import ImportReview from './ImportReview.vue'
import { useImport } from './useImport'

const router = useRouter()
const imp = useImport()
const { plan, error, done, applying, loaded } = imp
const cancel = () => (window.history.state?.back ? router.back() : router.push({ name: 'anuncios' }))
</script>

<template>
  <UiPageHeader title="Importar" />
  <ImportDone v-if="done" :result="done" />
  <div v-else-if="plan" class="flex flex-col gap-4">
    <UiBanner v-if="error" tone="danger">{{ error }}</UiBanner>
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
  <div v-else-if="error" class="flex max-w-xl flex-col items-start gap-4">
    <UiBanner tone="danger">{{ error }}</UiBanner>
    <ImportButton label="Elegir otro archivo" />
  </div>
  <UiEmptyState v-else-if="loaded" message="Elige un archivo exportado de Anuncios del Sábado.">
    <ImportButton />
  </UiEmptyState>
</template>
