<script setup lang="ts">
// Modo de una sola ventana (RF-66), para cuando las pantallas están en espejo: la slide a pantalla
// completa, controlada solo con teclado o clicker, sin controles. Esc vuelve a la presentación.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { INITIAL_STATE, apply, type PresenterState } from '../../../data/presenting'
import FullscreenHint from '../public/FullscreenHint.vue'
import SlideStage from '../shared/SlideStage.vue'
import { useCommandKeys } from '../shared/useCommandKeys'
import { usePresentingData } from '../shared/usePresentingData'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))
const { slides, ctx, total } = usePresentingData(id)
const state = ref<PresenterState>({ ...INITIAL_STATE })
const hint = ref(true)

useCommandKeys((command) => {
  if (command.type !== 'exit') return void (state.value = apply(state.value, command, total.value))
  void document.exitFullscreen?.().catch(() => {})
  void router.push({ name: 'presentacion', params: { id: id.value } })
})

function goFullscreen() {
  hint.value = false
  void document.documentElement.requestFullscreen?.().catch(() => {})
}
</script>

<template>
  <div data-single class="fixed inset-0 cursor-none bg-black">
    <SlideStage :slides="slides" :ctx="ctx" :state="state" />
    <FullscreenHint v-if="hint" @go="goFullscreen" />
  </div>
</template>
