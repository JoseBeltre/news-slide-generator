<script setup lang="ts">
// Casilla con su etiqueta (zona táctil de 44 px en el celular).
defineProps<{ disabled?: boolean }>()
const checked = defineModel<boolean>({ default: false })
</script>

<template>
  <label :class="['inline-flex min-h-11 items-center gap-2 text-sm text-ink md:min-h-9', disabled ? 'opacity-50' : 'cursor-pointer']">
    <input
      v-model="checked"
      type="checkbox"
      :disabled="disabled"
      class="size-5 shrink-0 accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    />
    <slot />
  </label>
</template>
