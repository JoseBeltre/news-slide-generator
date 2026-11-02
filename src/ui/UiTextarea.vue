<script setup lang="ts">
// Campo de varias líneas. Los atributos (id, rows, aria-*) pasan al <textarea>.
import { FIELD_CLASS } from './fieldClasses'

const model = defineModel<string | undefined>()
</script>

<template>
  <textarea
    :value="model ?? ''"
    rows="3"
    :class="[FIELD_CLASS, 'min-h-24 py-2.5']"
    @input="model = ($event.target as HTMLTextAreaElement).value"
  />
</template>
