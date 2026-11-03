<script setup lang="ts">
// Botón de solo ícono (acciones de fila). `label` es su nombre accesible y su tooltip.
import type { Component } from 'vue'

withDefaults(defineProps<{ label: string; icon: Component; variant?: 'ghost' | 'danger' }>(), { variant: 'ghost' })
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    :class="[
      'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:size-10',
      variant === 'danger' ? 'text-danger hover:bg-danger-bg' : 'text-ink-muted hover:bg-muted hover:text-ink',
    ]"
  >
    <component :is="icon" :size="20" aria-hidden="true" />
  </button>
</template>
