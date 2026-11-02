<script setup lang="ts">
// Estilo de la slide (§9): Himnario, Almanaque o Cartel; el de Configuración lleva "Por defecto".
import { computed } from 'vue'
import { SLIDE_STYLES, type SlideStyleId } from '../../../../slides/styles'
import UiChoiceGroup from '../../../../ui/UiChoiceGroup.vue'
import OptionGroup from './OptionGroup.vue'

const props = defineProps<{ defaultStyle: SlideStyleId }>()
const slideStyle = defineModel<SlideStyleId | undefined>()

const options = computed(() =>
  SLIDE_STYLES.map((s) => ({ value: s.id, label: s.name, hint: s.id === props.defaultStyle ? 'Por defecto' : undefined })),
)
</script>

<template>
  <OptionGroup title="Estilo">
    <UiChoiceGroup
      :model-value="slideStyle ?? defaultStyle"
      :options="options"
      label="Estilo de la slide"
      variant="cards"
      @update:model-value="slideStyle = $event as SlideStyleId"
    />
  </OptionGroup>
</template>
