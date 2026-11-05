<script setup lang="ts">
// "Importar como copia" (por defecto) o "Sobrescribir" para algo que ya está en este equipo.
import type { Resolution } from '../../../data/transfer/plan'
import UiChoiceGroup from '../../../ui/UiChoiceGroup.vue'

defineProps<{ label: string }>()
const model = defineModel<Resolution>({ required: true })
const OPTIONS = [
  { value: 'copia', label: 'Importar como copia' },
  { value: 'sobrescribir', label: 'Sobrescribir' },
]
</script>

<template>
  <UiChoiceGroup :model-value="model" :options="OPTIONS" :label="label" @update:model-value="model = $event as Resolution" />
</template>
