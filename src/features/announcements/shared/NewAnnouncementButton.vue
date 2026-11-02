<script setup lang="ts">
// El botón principal "Nuevo anuncio" (atajo N, en el marco de la app).
import UiButton from '../../../ui/UiButton.vue'
</script>

<template>
  <UiButton variant="primary" :to="{ name: 'nuevo' }" aria-keyshortcuts="N">Nuevo anuncio</UiButton>
</template>
