<script setup lang="ts">
// Estado vacío: qué pasa y, en el slot, la acción para salir de él.
defineProps<{ message: string }>()
</script>

<template>
  <div class="flex flex-col items-center gap-4 rounded-md border border-dashed border-hairline px-6 py-10 text-center">
    <p class="text-ink-muted">{{ message }}</p>
    <slot />
  </div>
</template>
