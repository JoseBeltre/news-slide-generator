<script setup lang="ts">
// Franja de la vista del equipo (spec P9 §6.5, mockup aprobado): avisa que la página trae datos privados.
import { Lock } from '@lucide/vue'
</script>

<template>
  <p data-team-banner role="note" class="mt-3 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-bg px-3 py-2.5 text-sm/snug text-ink">
    <Lock :size="16" aria-hidden="true" class="mt-0.5 shrink-0" />
    <span><strong class="font-medium">Vista del equipo.</strong> Incluye nombres y contactos privados. No compartas capturas de esta pantalla.</span>
  </p>
</template>
