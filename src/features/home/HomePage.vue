<script setup lang="ts">
// Inicio (SRS §6.1). Los próximos anuncios llegan en la Tarea 3; la presentación del sábado, en P5.
import UiButton from '../../ui/UiButton.vue'
import UiPageHeader from '../../ui/UiPageHeader.vue'
</script>

<template>
  <UiPageHeader title="Próximos anuncios">
    <UiButton variant="primary" :to="{ name: 'nuevo' }">Nuevo anuncio</UiButton>
  </UiPageHeader>
</template>
