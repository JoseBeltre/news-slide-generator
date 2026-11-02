<script setup lang="ts">
// Un campo del formulario: UiField (etiqueta, contador, error) + el control de su tipo.
// Este es el único lugar que sabe qué control usa cada FieldKind.
import { computed, type Component } from 'vue'
import type { FieldDef, FieldKind } from '../../../../slides/types/fields'
import UiField from '../../../../ui/UiField.vue'
import FieldChoice from './fields/FieldChoice.vue'
import FieldImage from './fields/FieldImage.vue'
import FieldList from './fields/FieldList.vue'
import FieldMoney from './fields/FieldMoney.vue'
import FieldPeople from './fields/FieldPeople.vue'
import FieldText from './fields/FieldText.vue'

const props = defineProps<{ field: FieldDef; modelValue: unknown; error?: string; nestedErrors?: Record<string, string> }>()
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()

const CONTROLS: Record<FieldKind, Component> = {
  text: FieldText,
  longtext: FieldText,
  date: FieldText,
  time: FieldText,
  money: FieldMoney,
  choice: FieldChoice,
  list: FieldList,
  image: FieldImage,
  people: FieldPeople,
}

const id = computed(() => `campo-${props.field.key}`)
/** Caracteres para el contador (orientativo: quien decide si cabe es el motor, §5.6). */
const count = computed(() => {
  const v = props.modelValue
  if (typeof v === 'string') return v.length
  return Array.isArray(v) ? v.join(', ').length : 0
})
</script>

<template>
  <UiField :id="id" :label="field.label" :required="field.required" :max="field.maxLength" :count="count" :error="error">
    <template #default="{ describedBy, invalid }">
      <component
        :is="CONTROLS[field.kind]"
        :id="id"
        :field="field"
        :model-value="modelValue"
        :invalid="invalid"
        :described-by="describedBy"
        :nested-errors="nestedErrors"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </template>
  </UiField>
</template>
