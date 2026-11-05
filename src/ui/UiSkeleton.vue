<script setup lang="ts">
// Bloque de carga con un brillo que lo cruza. Con "reducir movimiento" pulsa suave en vez de brillar.
</script>

<template>
  <span
    aria-hidden="true"
    class="relative block overflow-hidden bg-muted after:absolute after:inset-0 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-surface/65 after:to-transparent motion-safe:after:animate-shimmer motion-reduce:animate-fade-pulse"
  />
</template>
