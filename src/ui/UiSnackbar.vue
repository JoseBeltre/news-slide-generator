<script setup lang="ts">
// Aviso breve al pie (reemplaza los avisos en línea). Normal: oscuro, se va solo a los 4 s con una barra
// fina que se vacía. Error (rojo) y advertencia (ámbar) no se cierran solos: × o su acción.
import { Check, CircleAlert, TriangleAlert, X } from '@lucide/vue'
import { dismiss, runSnackAction, snackbarState } from './useSnackbar'

const LIVE = [
  { role: 'status', politeness: 'polite', error: false },
  { role: 'alert', politeness: 'assertive', error: true },
] as const
const TONES = {
  normal: 'bg-primary text-on-primary',
  error: 'border border-danger bg-danger-bg text-danger',
  warning: 'border border-warning bg-warning-bg text-warning',
}
const ACTION = 'min-h-11 cursor-pointer rounded-sm px-3.5 text-[15px] font-semibold underline underline-offset-4 transition-[background-color,transform] duration-150 hover:bg-current/15 active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current'
</script>

<template>
  <!-- Dos regiones vivas siempre montadas (las que están desde el inicio sí se anuncian): una cortés para los avisos
       normales y de advertencia, otra asertiva para los errores. Solo cambia su contenido. -->
  <div class="pointer-events-none fixed inset-x-3 bottom-[calc(var(--spacing-nav)+0.75rem)] z-50 md:inset-x-auto md:bottom-6 md:left-6 md:w-104">
    <div v-for="live in LIVE" :key="live.role" :role="live.role" :aria-live="live.politeness" aria-atomic="true">
      <Transition
        mode="out-in"
        enter-active-class="motion-safe:animate-snack-in motion-reduce:animate-fade-in"
        leave-active-class="motion-safe:animate-snack-out motion-reduce:animate-fade-out"
      >
        <div
          v-if="snackbarState.current && (snackbarState.current.tone === 'error') === live.error"
          :key="snackbarState.current.id"
          data-snackbar
          :data-tone="snackbarState.current.tone"
          :class="['pointer-events-auto relative flex min-h-13 items-center gap-2 overflow-hidden rounded-md py-1 pr-1 pl-4 text-[15px] shadow-lg', TONES[snackbarState.current.tone]]"
        >
          <Check v-if="snackbarState.current.success" :size="18" aria-hidden="true" class="shrink-0" />
          <CircleAlert v-else-if="snackbarState.current.tone === 'error'" :size="18" aria-hidden="true" class="shrink-0" />
          <TriangleAlert v-else-if="snackbarState.current.tone === 'warning'" :size="18" aria-hidden="true" class="shrink-0" />
          <span class="min-w-0 flex-1 py-2">{{ snackbarState.current.message }}</span>
          <button v-if="snackbarState.current.action" type="button" data-snackbar-action :class="ACTION" @click="runSnackAction(snackbarState.current.id)">
            {{ snackbarState.current.action.label }}
          </button>
          <button
            v-if="snackbarState.current.tone !== 'normal'"
            type="button"
            aria-label="Cerrar aviso"
            class="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-[background-color,transform] duration-150 hover:bg-current/15 active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            @click="dismiss(snackbarState.current.id)"
          >
            <X :size="18" aria-hidden="true" />
          </button>
          <span
            v-if="snackbarState.current.tone === 'normal'"
            aria-hidden="true"
            class="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-on-primary/50 motion-safe:animate-drain motion-reduce:hidden"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>
