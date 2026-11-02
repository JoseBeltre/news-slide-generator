<script setup lang="ts">
// Paso 2 (RF-03): abre el anuncio de la ruta y monta el editor.
import UiButton from '../../../ui/UiButton.vue'
import UiEmptyState from '../../../ui/UiEmptyState.vue'
import AnnouncementEditor from './AnnouncementEditor.vue'
import { useEditorRecord } from './useEditorRecord'

const { record, missing, key, onSaved } = useEditorRecord()
</script>

<template>
  <UiEmptyState v-if="missing" message="No encontramos este anuncio.">
    <UiButton :to="{ name: 'anuncios' }">Ver anuncios</UiButton>
  </UiEmptyState>
  <AnnouncementEditor v-else-if="record" :key="key" :initial="record" @saved="onSaved" />
</template>
