<script setup lang="ts">
// Una opción entre pocas (modo de cumpleaños, mostrar el día): botones de opción.
import UiChoiceGroup from '../../../../../ui/UiChoiceGroup.vue'
import type { ControlProps } from '../controlProps'

defineProps<ControlProps>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <UiChoiceGroup
    :id="id"
    :model-value="typeof modelValue === 'string' ? modelValue : undefined"
    :options="field.options ?? []"
    :label="field.label"
    :aria-describedby="describedBy"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
