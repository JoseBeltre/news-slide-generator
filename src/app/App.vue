<script setup lang="ts">
// Marco de la app: encabezado, la pantalla de la ruta actual (con su cambio animado), la barra inferior del
// celular, el aviso (snackbar) y el diálogo de confirmación.
// Atajo global N: nuevo anuncio (DESIGN.md). Al navegar se cierra cualquier pregunta abierta.
// Las rutas con meta.bare (presentar) van sin marco ni atajo N: la pantalla es toda de la slide.
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed, onBeforeUnmount, ref } from 'vue'
import UiConfirm from '../ui/UiConfirm.vue'
import UiSnackbar from '../ui/UiSnackbar.vue'
import { answerConfirm, confirmState } from '../ui/useConfirm'
import { useShortcut } from '../ui/useShortcut'
import AppBottomNav from './AppBottomNav.vue'
import AppHeader from './AppHeader.vue'
import { pageDirection, pageKey } from './navigation'

const router = useRouter()
const route = useRoute()
useShortcut('n', () => void (route.meta.bare || router.push({ name: 'nuevo' })))
// Una pregunta de otra pantalla no queda abierta tras navegar (Atrás del navegador): se responde "no".
const stopClosing = router.afterEach(() => confirmState.request && answerConfirm(false))
// Dirección del cambio de página: adelante entra por la derecha, atrás por la izquierda (8 px + fundido).
const direction = ref<1 | -1>(1)
const stopDirection = router.beforeEach((to, from) => void (direction.value = pageDirection(from.name, to.name)))
onBeforeUnmount(() => {
  stopClosing()
  stopDirection()
})

const SHIFT = {
  1: { from: 'translate-x-2', to: '-translate-x-2' },
  [-1]: { from: '-translate-x-2', to: 'translate-x-2' },
} as const
const enterFrom = computed(() => `opacity-0 ${SHIFT[direction.value].from} motion-reduce:translate-x-0`)
const leaveTo = computed(() => `opacity-0 ${SHIFT[direction.value].to} motion-reduce:translate-x-0`)
</script>

<template>
  <RouterView v-if="route.meta.bare" />
  <template v-else>
    <AppHeader />
    <main class="mx-auto max-w-7xl overflow-x-clip px-4 pt-4 pb-[calc(var(--spacing-nav)+1.5rem)] md:px-8 md:py-8">
      <RouterView v-slot="{ Component, route: current }">
        <Transition
          mode="out-in"
          enter-active-class="transition duration-250 ease-out"
          leave-active-class="transition duration-150 ease-in"
          :enter-from-class="enterFrom"
          :leave-to-class="leaveTo"
        >
          <div :key="pageKey(current.name)"><component :is="Component" /></div>
        </Transition>
      </RouterView>
    </main>
    <AppBottomNav />
  </template>
  <UiConfirm />
  <UiSnackbar />
</template>
