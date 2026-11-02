<script setup lang="ts">
// Marco de la app: encabezado, la pantalla de la ruta actual y el diálogo de confirmación.
// Atajo global N: nuevo anuncio (DESIGN.md).
import { RouterView, useRouter } from 'vue-router'
import UiConfirm from '../ui/UiConfirm.vue'
import { useShortcut } from '../ui/useShortcut'
import AppHeader from './AppHeader.vue'

const router = useRouter()
useShortcut('n', () => void router.push({ name: 'nuevo' }))
</script>

<template>
  <AppHeader />
  <main class="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
    <RouterView />
  </main>
  <UiConfirm />
</template>
