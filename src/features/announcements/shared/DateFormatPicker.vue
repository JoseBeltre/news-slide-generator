<script setup lang="ts">
// Formato de la fecha en la slide, con un ejemplo de cada uno, y "Fechas relativas" (HOY, MAÑANA).
// Si el anuncio no lo elige, sigue a Configuración.
import { computed } from 'vue'
import { formatEventDate, type DateStyle } from '../../../lib/format'
import UiCheckbox from '../../../ui/UiCheckbox.vue'
import UiChoiceGroup from '../../../ui/UiChoiceGroup.vue'
import OptionGroup from './OptionGroup.vue'

const props = defineProps<{ sampleDate: string; today: string; defaults: { dateStyle: DateStyle; relativeDates: boolean } }>()
const dateStyle = defineModel<DateStyle | undefined>('dateStyle')
const relativeDates = defineModel<boolean | undefined>('relativeDates')

const STYLES: { value: DateStyle; label: string }[] = [
  { value: 'largo', label: 'Larga' },
  { value: 'medio', label: 'Media' },
  { value: 'corto', label: 'Corta' },
  { value: 'corto-mes-completo', label: 'Corta con mes' },
]
const options = computed(() =>
  STYLES.map((s) => ({ ...s, hint: formatEventDate(props.sampleDate, { style: s.value, reference: props.today }) })),
)
</script>

<template>
  <OptionGroup title="Fecha">
    <UiChoiceGroup
      :model-value="dateStyle ?? defaults.dateStyle"
      :options="options"
      label="Formato de la fecha"
      variant="cards"
      @update:model-value="dateStyle = $event as DateStyle"
    />
    <UiCheckbox :model-value="relativeDates ?? defaults.relativeDates" @update:model-value="relativeDates = $event">
      Fechas relativas (HOY, MAÑANA)
    </UiCheckbox>
  </OptionGroup>
</template>
