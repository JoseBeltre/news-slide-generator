<script setup lang="ts">
// Marco de la app: encabezado, la pantalla de la ruta actual y el diálogo de confirmación.
// Atajo global N: nuevo anuncio (DESIGN.md). Al navegar se cierra cualquier pregunta abierta.
// Las rutas con meta.bare (presentar) van sin marco ni atajo N: la pantalla es toda de la slide.
import { RouterView, useRoute, useRouter } from 'vue-router'
import { onBeforeUnmount } from 'vue'
import UiConfirm from '../ui/UiConfirm.vue'
import { answerConfirm, confirmState } from '../ui/useConfirm'
import { useShortcut } from '../ui/useShortcut'
import AppHeader from './AppHeader.vue'

const router = useRouter()
const route = useRoute()
useShortcut('n', () => void (route.meta.bare || router.push({ name: 'nuevo' })))
// Una pregunta de otra pantalla no queda abierta tras navegar (Atrás del navegador): se responde "no".
const stopClosing = router.afterEach(() => confirmState.request && answerConfirm(false))
onBeforeUnmount(stopClosing)
</script>

<template>
  <RouterView v-if="route.meta.bare" />
  <template v-else>
    <AppHeader />
    <main class="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <RouterView />
    </main>
  </template>
  <UiConfirm />
</template>
