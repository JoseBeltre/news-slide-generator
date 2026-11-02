<script setup lang="ts">
// Botón de DESIGN.md: una sola variante principal por pantalla. Con `to` es un enlace de la app;
// con `as="label"` envuelve un <input type="file"> (el foco del input se ve en la etiqueta).
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    type?: 'button' | 'submit'
    to?: RouteLocationRaw
    as?: 'button' | 'label'
    disabled?: boolean
  }>(),
  { variant: 'secondary', type: 'button', as: 'button' },
)

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-ink text-ink hover:bg-muted',
  ghost: 'text-ink underline-offset-4 hover:underline',
  danger: 'border border-danger text-danger hover:bg-danger-bg',
}

const classes = computed(() => [
  'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-colors md:h-10',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50',
  props.as === 'label' && 'cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
  VARIANTS[props.variant],
])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes"><slot /></RouterLink>
  <label v-else-if="as === 'label'" :class="classes"><slot /></label>
  <button v-else :type="type" :disabled="disabled" :class="classes"><slot /></button>
</template>
