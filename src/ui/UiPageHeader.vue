<script setup lang="ts">
// Título de pantalla (Instrument Serif) con sus acciones a la derecha.
defineProps<{ title: string }>()
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-3.5 md:pb-6">
    <h1 class="font-display text-title text-ink md:text-display">{{ title }}</h1>
    <div v-if="$slots.default" class="flex items-center gap-2"><slot /></div>
  </header>
</template>
