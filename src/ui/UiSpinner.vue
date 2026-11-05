<script setup lang="ts">
// Anillo que gira dentro de un botón mientras trabaja. Con "reducir movimiento" pulsa en vez de girar.
</script>

<template>
  <span aria-hidden="true" class="block size-4.5 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin-fast motion-reduce:animate-fade-pulse" />
</template>
