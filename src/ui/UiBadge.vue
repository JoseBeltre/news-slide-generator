<script setup lang="ts">
// Etiqueta de estado corta ("BORRADOR", "NO CABE") en tipografía `meta` sobre su color de fondo.
withDefaults(defineProps<{ tone?: 'neutral' | 'danger' | 'warning' | 'success' }>(), { tone: 'neutral' })

const TONES = {
  neutral: 'bg-muted text-ink-muted',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  success: 'bg-success-bg text-success',
}
</script>

<template>
  <span :class="['inline-flex shrink-0 items-center rounded-sm px-2 py-0.5 font-meta text-meta uppercase', TONES[tone]]">
    <slot />
  </span>
</template>
