<script setup lang="ts">
// Revisión antes de importar (RF-112): la presentación (si la hay), los anuncios, el aviso de imágenes
// que faltan y los botones. Importar no se puede mientras la fecha esté ocupada o no haya nada.
import { computed } from 'vue'
import { canApply, dateConflict, type ImportPlan, type Resolution } from '../../../data/transfer/plan'
import UiBanner from '../../../ui/UiBanner.vue'
import UiButton from '../../../ui/UiButton.vue'
import ImportItem from './ImportItem.vue'
import PresentationChoice from './PresentationChoice.vue'

const props = defineProps<{ plan: ImportPlan; applying: boolean }>()
const emit = defineEmits<{
  resolution: [id: string, value: Resolution]
  toggle: [id: string]
  presentationResolution: [value: Resolution]
  targetDate: [value: string]
  confirm: []
  cancel: []
}>()

const isPresentation = computed(() => !!props.plan.presentation)
const missing = computed(() => {
  const n = props.plan.missingImages
  if (!n) return null
  return n === 1 ? 'Falta una imagen: esa slide saldrá sin ella.' : `Faltan ${n} imágenes: esas slides saldrán sin ellas.`
})
</script>

<template>
  <div class="flex max-w-3xl flex-col gap-6">
    <PresentationChoice
      v-if="plan.presentation"
      :presentation="plan.presentation"
      :conflict="dateConflict(plan)"
      @resolution="emit('presentationResolution', $event)"
      @target-date="emit('targetDate', $event)"
    />
    <section aria-label="Anuncios del archivo">
      <h2 v-if="isPresentation" class="pb-1 text-sm font-medium text-ink">Anuncios</h2>
      <ul>
        <ImportItem
          v-for="item in plan.announcements"
          :key="item.id"
          :item="item"
          :selectable="isPresentation"
          @toggle="emit('toggle', item.id)"
          @resolution="(v) => emit('resolution', item.id, v)"
        />
      </ul>
    </section>
    <UiBanner v-if="missing">{{ missing }}</UiBanner>
    <div class="flex flex-wrap gap-3">
      <UiButton variant="primary" :disabled="applying || !canApply(plan)" @click="emit('confirm')">Importar</UiButton>
      <UiButton variant="ghost" @click="emit('cancel')">Cancelar</UiButton>
    </div>
  </div>
</template>
