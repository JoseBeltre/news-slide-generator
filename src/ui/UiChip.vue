<script setup lang="ts">
// Chip: filtro que se activa y desactiva (aria-pressed), o un elemento quitable de una lista.
defineProps<{ pressed?: boolean }>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-sm border border-field-border bg-surface px-3 text-sm font-medium text-ink hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-pressed:border-ink aria-pressed:bg-primary aria-pressed:text-on-primary md:h-9"
  >
    <slot />
  </button>
</template>
