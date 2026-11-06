<script setup lang="ts">
// Botón de DESIGN.md: una sola variante principal por pantalla. Con `to` es un enlace de la app;
// con `as="label"` envuelve un <input type="file"> (el foco del input se ve en la etiqueta).
// `busy` muestra el spinner / ✓ dentro del botón y lo deshabilita mientras trabaja.
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import UiButtonBody from './UiButtonBody.vue'
import type { BusyState } from './useBusy'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    type?: 'button' | 'submit'
    to?: RouteLocationRaw
    as?: 'button' | 'label'
    disabled?: boolean
    busy?: BusyState
    /** Al lado de un campo: mismo alto que UiInput. */
    tall?: boolean
  }>(),
  { variant: 'secondary', type: 'button', as: 'button', busy: 'idle' },
)

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-ink text-ink hover:bg-muted',
  ghost: 'text-ink underline-offset-4 hover:underline',
  danger: 'border border-danger text-danger hover:bg-danger-bg',
}

const working = computed(() => props.busy !== 'idle')
const classes = computed(() => [
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm px-4 text-[15px] font-medium transition-[background-color,opacity,transform] duration-150 ease-out active:scale-97 md:text-sm',
  props.tall ? 'h-12 md:h-11' : 'h-11 md:h-10',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50',
  props.as === 'label' && 'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
  working.value && 'pointer-events-none',
  props.busy === 'loading' && 'opacity-75',
  VARIANTS[props.variant],
])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes"><UiButtonBody :busy="busy"><slot /></UiButtonBody></RouterLink>
  <label v-else-if="as === 'label'" :class="classes" :aria-busy="busy === 'loading' || undefined"><UiButtonBody :busy="busy"><slot /></UiButtonBody></label>
  <button v-else :type="type" :disabled="disabled || working" :aria-busy="busy === 'loading' || undefined" :class="classes">
    <UiButtonBody :busy="busy"><slot /></UiButtonBody>
  </button>
</template>
