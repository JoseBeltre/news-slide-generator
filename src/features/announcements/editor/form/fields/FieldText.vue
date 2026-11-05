<script setup lang="ts">
// Texto, texto largo, fecha y hora: un control nativo según el tipo de campo.
import { computed } from 'vue'
import UiInput from '../../../../../ui/UiInput.vue'
import UiTextarea from '../../../../../ui/UiTextarea.vue'
import type { ControlProps } from '../controlProps'

const props = defineProps<ControlProps>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const value = computed(() => (typeof props.modelValue === 'string' ? props.modelValue : undefined))
const inputType = computed(() => (props.field.kind === 'date' || props.field.kind === 'time' ? props.field.kind : 'text'))
</script>

<template>
  <UiTextarea
    v-if="field.kind === 'longtext'"
    :id="id"
    :model-value="value"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
    @update:model-value="emit('update:modelValue', $event ?? '')"
  />
  <UiInput
    v-else
    :id="id"
    :type="inputType"
    :placeholder="field.placeholder"
    :model-value="value"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
    @update:model-value="emit('update:modelValue', $event ?? '')"
  />
</template>
