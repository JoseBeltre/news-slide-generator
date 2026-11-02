<script setup lang="ts">
// Aviso a todo el ancho (DESIGN.md → Avisos): fondo del estado, ícono y texto. Nunca un modal.
import { CircleAlert, CircleCheck, TriangleAlert } from '@lucide/vue'

type Tone = 'danger' | 'warning' | 'success'
withDefaults(defineProps<{ tone?: Tone }>(), { tone: 'warning' })

const TONES: Record<Tone, string> = {
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  success: 'bg-success-bg text-success',
}
const ICONS = { danger: CircleAlert, warning: TriangleAlert, success: CircleCheck }
</script>

<template>
  <div :data-banner="tone" :role="tone === 'danger' ? 'alert' : 'status'" :class="['flex items-start gap-2 rounded-md px-3 py-2.5 text-sm', TONES[tone]]">
    <component :is="ICONS[tone]" :size="18" aria-hidden="true" class="mt-0.5 shrink-0" />
    <div class="min-w-0 flex-1"><slot /></div>
  </div>
</template>
