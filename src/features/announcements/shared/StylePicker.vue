<script setup lang="ts">
// Estilo de la slide (§9): Himnario, Almanaque o Cartel; el de Configuración lleva "Por defecto".
// Lo usan el editor de anuncios y la portada y el cierre de una presentación.
import { computed } from 'vue'
import { SLIDE_STYLES, type SlideStyleId } from '../../../slides/styles'
import UiChoiceGroup from '../../../ui/UiChoiceGroup.vue'

const props = defineProps<{ defaultStyle: SlideStyleId; label: string }>()
const slideStyle = defineModel<SlideStyleId | undefined>()

const options = computed(() =>
  SLIDE_STYLES.map((s) => ({ value: s.id, label: s.name, hint: s.id === props.defaultStyle ? 'Por defecto' : undefined })),
)
</script>

<template>
  <UiChoiceGroup
    :model-value="slideStyle ?? defaultStyle"
    :options="options"
    :label="label"
    variant="cards"
    @update:model-value="slideStyle = $event as SlideStyleId"
  />
</template>
