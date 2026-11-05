<script setup lang="ts">
// El editor de un anuncio: formulario y notas a un lado, vista previa y opciones al otro.
// Guardar (Ctrl+S) siempre se puede: si no valida o no cabe, queda como borrador (RF-10).
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createRepository, type NewRecord } from '../../../data/local/repository'
import type { Announcement } from '../../../data/models'
import { useDb } from '../../../data/useDb'
import UiBadge from '../../../ui/UiBadge.vue'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import ExportButton from '../../transfer/shared/ExportButton.vue'
import { useShortcut } from '../../../ui/useShortcut'
import EditorBackRow from './EditorBackRow.vue'
import EditorLayout from './EditorLayout.vue'
import { flaggedFields } from './fitMessages'
import AnnouncementForm from './form/AnnouncementForm.vue'
import PresenterNotes from './form/PresenterNotes.vue'
import SaveButton from './SaveButton.vue'
import SlideOptions from './options/SlideOptions.vue'
import FitStatusBanner from './preview/FitStatusBanner.vue'
import PreviewPanel from './preview/PreviewPanel.vue'
import { useAnnouncementDraft } from './useAnnouncementDraft'
import { useSlideContext } from '../../../data/useSlideContext'
import { useEditorSave } from './useEditorSave'
import { useUnsavedGuard } from './useUnsavedGuard'

const props = defineProps<{ initial: NewRecord<Announcement> }>()
const emit = defineEmits<{ saved: [announcement: Announcement] }>()

const router = useRouter()
const route = useRoute()
const ctx = useSlideContext()
const { draft, typeDef, validation, slides, slideStatus, dirty, save } = useAnnouncementDraft(
  props.initial,
  ctx,
  createRepository(useDb().announcements),
)
useUnsavedGuard(dirty)

// Un anuncio guardado que ya no valida abre mostrando sus errores.
const submitted = ref(!!props.initial.id && !validation.value.ok)
const errors = computed(() => (validation.value.ok ? {} : validation.value.errors))
const flagged = computed(() => flaggedFields(slideStatus.value))
const { state: saveState, onSave } = useEditorSave({
  save,
  isNew: () => !draft.value.id,
  submitted,
  onFirstSave: async (saved) => {
    emit('saved', saved)
    await router.replace({ name: 'editar', params: { id: saved.id } })
  },
})
useShortcut('mod+s', () => void onSave(), { allowInFields: true })
const badge = computed(() =>
  slideStatus.value.status === 'no_cabe' ? 'No cabe' : draft.value.status === 'borrador' ? 'Borrador' : null,
)

// Duplicar abre con el foco en la fecha (RF-02).
onMounted(() => {
  const focus = route.query.foco
  if (typeof focus === 'string') document.getElementById(`campo-${focus}`)?.focus()
})
</script>

<template>
  <EditorBackRow class="md:hidden">
    <UiBadge v-if="badge" :tone="badge === 'No cabe' ? 'danger' : 'warning'">{{ badge }}</UiBadge>
  </EditorBackRow>
  <UiPageHeader :title="typeDef.name">
    <ExportButton v-if="initial.id" kind="anuncio" :id="initial.id" class="max-md:hidden" />
    <SaveButton :busy="saveState" class="max-md:hidden" @click="onSave" />
  </UiPageHeader>
  <EditorLayout>
    <template #form>
      <AnnouncementForm
        :type-def="typeDef"
        :values="draft.values"
        :errors="errors"
        :submitted="submitted"
        :flagged="flagged"
        @update:field="(key, value) => (draft.values[key] = value)"
      />
      <PresenterNotes v-model="draft.presenterNotes" />
      <SaveButton :busy="saveState" class="w-full md:hidden" @click="onSave" />
    </template>
    <template #preview>
      <PreviewPanel :slides="slides" :ctx="ctx" @status="slideStatus = $event" />
      <FitStatusBanner :status="slideStatus" :type-def="typeDef" />
    </template>
    <template #options>
      <SlideOptions v-model="draft" :type-def="typeDef" :ctx="ctx" />
    </template>
  </EditorLayout>
</template>
