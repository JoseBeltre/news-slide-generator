<script setup lang="ts">
// Marco de la app: encabezado y la pantalla de la ruta actual.
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main class="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
    <RouterView />
  </main>
</template>
