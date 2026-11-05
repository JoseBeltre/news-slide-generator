<script setup lang="ts">
// Contenido de un botón con estado: el texto se desvanece y en su lugar entra el spinner (cargando) o
// el ✓ (hecho), sin cambiar el ancho del botón. El botón que lo usa debe ser `relative`.
import { Check } from '@lucide/vue'
import type { BusyState } from './useBusy'
import UiSpinner from './UiSpinner.vue'

withDefaults(defineProps<{ busy?: BusyState }>(), { busy: 'idle' })
</script>

<template>
  <span :class="['inline-flex items-center justify-center gap-2 transition-opacity duration-150 ease-out', busy !== 'idle' && 'opacity-0']"><slot /></span>
  <span v-if="busy !== 'idle'" class="absolute inset-0 grid place-items-center">
    <UiSpinner v-if="busy === 'loading'" />
    <Check v-else :size="20" aria-hidden="true" class="motion-safe:animate-pop-in" />
  </span>
</template>
