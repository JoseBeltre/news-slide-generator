<script setup lang="ts">
// El editor de un anuncio: formulario y notas a un lado, vista previa y opciones al otro.
// Guardar (Ctrl+S) siempre se puede: si no valida o no cabe, queda como borrador (RF-10).
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createRepository, type NewRecord } from '../../../data/local/repository'
import type { Announcement } from '../../../data/models'
import { useDb } from '../../../data/useDb'
import UiButton from '../../../ui/UiButton.vue'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import { useShortcut } from '../../../ui/useShortcut'
import EditorLayout from './EditorLayout.vue'
import { flaggedFields } from './fitMessages'
import AnnouncementForm from './form/AnnouncementForm.vue'
import PresenterNotes from './form/PresenterNotes.vue'
import SlideOptions from './options/SlideOptions.vue'
import FitStatusBanner from './preview/FitStatusBanner.vue'
import PreviewPanel from './preview/PreviewPanel.vue'
import { useAnnouncementDraft } from './useAnnouncementDraft'
import { useSlideContext } from '../../../data/useSlideContext'
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
const saving = ref(false)
/** Qué se guardó la última vez: "listo" o un borrador (no valida o no cabe, RF-10). */
const savedAs = ref<Announcement['status']>()
watch(dirty, (d) => d && (savedAs.value = undefined))

async function onSave() {
  if (saving.value) return
  saving.value = true
  submitted.value = true
  try {
    const wasNew = !draft.value.id
    const saved = await save()
    savedAs.value = saved.status
    if (wasNew) {
      emit('saved', saved)
      await router.replace({ name: 'editar', params: { id: saved.id } })
    }
  } finally {
    saving.value = false
  }
}
useShortcut('mod+s', () => void onSave(), { allowInFields: true })

// Duplicar abre con el foco en la fecha (RF-02).
onMounted(() => {
  const focus = route.query.foco
  if (typeof focus === 'string') document.getElementById(`campo-${focus}`)?.focus()
})
</script>

<template>
  <UiPageHeader :title="typeDef.name">
    <span v-if="savedAs" role="status" :class="['text-sm', savedAs === 'listo' ? 'text-success' : 'text-warning']">
      {{ savedAs === 'listo' ? 'Guardado' : 'Guardado como borrador' }}
    </span>
    <UiButton variant="primary" aria-keyshortcuts="Control+S" :disabled="saving" @click="onSave">Guardar</UiButton>
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
