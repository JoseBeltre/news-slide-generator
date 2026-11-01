<script setup lang="ts">
// Decoración de bordes según la dirección visual. Solo ocupa los márgenes (fuera del área segura)
// o la línea bajo el título, así nunca cambia el fondo de un texto.
import type { DecorationVariant } from './decoration'

defineProps<{ variant: DecorationVariant; accent: string }>()
</script>

<template>
  <div aria-hidden="true" style="position: absolute; inset: 0; pointer-events: none">
    <template v-if="variant === 'sobria'">
      <div :style="{ position: 'absolute', left: '96px', top: '380px', width: '160px', height: '8px', borderRadius: '4px', background: accent }" />
    </template>
    <template v-else-if="variant === 'banda'">
      <div :style="{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: accent }" />
    </template>
    <template v-else>
      <div :style="{ position: 'absolute', left: '-72px', top: '-72px', width: '144px', height: '144px', borderRadius: '50%', background: accent }" />
      <div :style="{ position: 'absolute', right: '-104px', bottom: '-104px', width: '200px', height: '200px', borderRadius: '50%', background: accent, opacity: 0.85 }" />
      <div :style="{ position: 'absolute', left: '160px', right: '160px', bottom: '24px', height: '12px', borderRadius: '6px', background: accent }" />
    </template>
  </div>
</template>
