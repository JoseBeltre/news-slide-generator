<script setup lang="ts">
// Campo de una línea. Los atributos (id, type, aria-*) pasan al <input>.
import { FIELD_CLASS } from './fieldClasses'

const model = defineModel<string | undefined>()
</script>

<template>
  <input
    :value="model ?? ''"
    :class="[FIELD_CLASS, 'h-12 md:h-11']"
    @input="model = ($event.target as HTMLInputElement).value"
  />
</template>
