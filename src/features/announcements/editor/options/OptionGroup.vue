<script setup lang="ts">
// Un grupo de opciones de la slide con su título (Plantilla, Estilo, Tema, Logo, Fecha).
defineProps<{ title: string }>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <h3 class="text-sm font-medium text-ink">{{ title }}</h3>
    <slot />
  </div>
</template>
