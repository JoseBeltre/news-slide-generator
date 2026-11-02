<script setup lang="ts">
// Marco de la app: encabezado, la pantalla de la ruta actual y el diálogo de confirmación.
// Atajo global N: nuevo anuncio (DESIGN.md). Al navegar se cierra cualquier pregunta abierta.
import { RouterView, useRouter } from 'vue-router'
import { onBeforeUnmount } from 'vue'
import UiConfirm from '../ui/UiConfirm.vue'
import { answerConfirm, confirmState } from '../ui/useConfirm'
import { useShortcut } from '../ui/useShortcut'
import AppHeader from './AppHeader.vue'

const router = useRouter()
useShortcut('n', () => void router.push({ name: 'nuevo' }))
// Una pregunta de otra pantalla no queda abierta tras navegar (Atrás del navegador): se responde "no".
const stopClosing = router.afterEach(() => confirmState.request && answerConfirm(false))
onBeforeUnmount(stopClosing)
</script>

<template>
  <AppHeader />
  <main class="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
    <RouterView />
  </main>
  <UiConfirm />
</template>
