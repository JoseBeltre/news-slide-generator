<script setup lang="ts">
// Botón de solo ícono (acciones de fila, barra superior, título de página). `label` es su nombre
// accesible y su tooltip; el ícono va siempre centrado. Con `to` es un enlace; con `as="label"` envuelve
// un <input type="file">. `busy` pone el spinner / ✓ en lugar del ícono.
import type { Component } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import UiButtonBody from './UiButtonBody.vue'
import type { BusyState } from './useBusy'

export type IconButtonVariant = 'ghost' | 'danger' | 'solid' | 'line'

withDefaults(
  defineProps<{ label: string; icon: Component; variant?: IconButtonVariant; to?: RouteLocationRaw; as?: 'button' | 'label'; busy?: BusyState; size?: number }>(),
  { variant: 'ghost', as: 'button', busy: 'idle', size: 20 },
)

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost: 'text-ink-muted hover:bg-muted hover:text-ink',
  danger: 'text-danger hover:bg-danger-bg',
  solid: 'bg-primary text-on-primary hover:opacity-90',
  line: 'border border-ink text-ink hover:bg-muted',
}
const BASE =
  'relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm leading-none transition-[background-color,opacity,transform] duration-150 ease-out active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink md:size-10'
</script>

<template>
  <RouterLink v-if="to" :to="to" :aria-label="label" :title="label" :class="[BASE, VARIANTS[variant]]">
    <UiButtonBody :busy="busy"><component :is="icon" :size="size" aria-hidden="true" /></UiButtonBody>
  </RouterLink>
  <label v-else-if="as === 'label'" :title="label" :class="[BASE, VARIANTS[variant], busy !== 'idle' && 'pointer-events-none']">
    <UiButtonBody :busy="busy"><component :is="icon" :size="size" aria-hidden="true" /></UiButtonBody>
    <slot />
  </label>
  <button v-else type="button" :aria-label="label" :title="label" :disabled="busy !== 'idle'" :aria-busy="busy === 'loading' || undefined" :class="[BASE, VARIANTS[variant]]">
    <UiButtonBody :busy="busy"><component :is="icon" :size="size" aria-hidden="true" /></UiButtonBody>
  </button>
</template>
