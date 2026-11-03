<script setup lang="ts">
// Puntos clave de la slide actual en texto grande, y las notas del presentador (RF-63).
import type { KeyPoints } from '../../../data/presenting'

defineProps<{ points: KeyPoints }>()
</script>

<template>
  <section data-key-points aria-label="Puntos clave" class="flex flex-col gap-3">
    <p v-if="points.label" class="font-meta text-meta uppercase text-ink-muted">{{ points.label }}</p>
    <h2 class="font-display text-display-sm text-ink">{{ points.heading }}</h2>
    <ul v-if="points.lines.length" class="flex flex-col gap-1 text-heading-sm text-ink">
      <li v-for="(line, i) in points.lines" :key="i">{{ line }}</li>
    </ul>
    <div v-if="points.notes" class="mt-2 border-l-2 border-hairline pl-3">
      <p class="font-meta text-meta uppercase text-ink-muted">Notas</p>
      <p class="text-xl whitespace-pre-line text-ink">{{ points.notes }}</p>
    </div>
  </section>
</template>
