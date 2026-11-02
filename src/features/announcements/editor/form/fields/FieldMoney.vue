<script setup lang="ts">
// Precio: se escribe como se dice ("1,500", "RD$ 500") y se guarda como número.
import { ref, watch } from 'vue'
import { parseMoneyInput } from '../../../../../lib/format'
import UiInput from '../../../../../ui/UiInput.vue'
import type { ControlProps } from '../controlProps'

const props = defineProps<ControlProps>()
const emit = defineEmits<{ 'update:modelValue': [value: number | string | undefined] }>()

const asText = (v: unknown) => (v === undefined || v === null ? '' : String(v))
// Lo escrito se conserva tal cual mientras se teclea; solo se reemplaza si el valor cambia desde fuera.
const text = ref(asText(props.modelValue))
watch(
  () => props.modelValue,
  (v) => {
    if (parseMoneyInput(text.value) !== v) text.value = asText(v)
  },
)

function onInput(value: string | undefined) {
  text.value = value ?? ''
  emit('update:modelValue', parseMoneyInput(text.value))
}
</script>

<template>
  <UiInput
    :id="id"
    :model-value="text"
    inputmode="decimal"
    placeholder="0"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
    @update:model-value="onInput"
  />
</template>
