<script setup lang="ts">
// Lista desplegable nativa. Los atributos (id, aria-*) pasan al <select>.
import { FIELD_CLASS } from './fieldClasses'

defineProps<{ options: readonly { value: string; label: string }[] }>()
const model = defineModel<string | undefined>()
</script>

<template>
  <select :value="model" :class="[FIELD_CLASS, 'h-11']" @change="model = ($event.target as HTMLSelectElement).value">
    <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
  </select>
</template>
