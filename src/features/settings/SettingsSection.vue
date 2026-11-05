<script setup lang="ts">
// Una sección de Configuración: ancla para el índice, su título y el contenido.
defineProps<{ id: string; title: string }>()
</script>

<template>
  <section :id="id" :aria-labelledby="`${id}-titulo`" class="scroll-mt-6 border-t border-hairline py-8 first:border-t-0 first:pt-0">
    <h2 :id="`${id}-titulo`" class="pb-5 font-display text-heading-sm text-ink md:text-heading">{{ title }}</h2>
    <slot />
  </section>
</template>
