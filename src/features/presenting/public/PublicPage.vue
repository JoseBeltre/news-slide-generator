<script setup lang="ts">
// Ventana pública (RF-60, RF-61): "tonta". Pide el estado al abrir, muestra lo que le dice el
// presentador y le envía las teclas como comandos; Esc solo sale de pantalla completa.
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { INITIAL_STATE, type PresenterState } from '../../../data/presenting'
import SlideStage from '../shared/SlideStage.vue'
import { useCommandKeys } from '../shared/useCommandKeys'
import { usePresentationChannel } from '../shared/usePresentationChannel'
import { usePresentingData } from '../shared/usePresentingData'
import FullscreenHint from './FullscreenHint.vue'

const route = useRoute()
const id = computed(() => String(route.params.id))
const { slides, ctx } = usePresentingData(id)
const state = ref<PresenterState>({ ...INITIAL_STATE })
const connected = ref(false)
const hint = ref(true)

const channel = usePresentationChannel(id.value)
channel.onMessage((m) => {
  if (m.type === 'state') state.value = m.state
  else if (m.type === 'goto') state.value = { index: m.index, black: false, logo: false }
  else if (m.type === 'black') state.value = { ...state.value, black: m.on, logo: false }
  else if (m.type === 'logo') state.value = { ...state.value, logo: m.on, black: false }
  else return
  connected.value = true
})
channel.send({ type: 'hello' })

useCommandKeys((command) => {
  if (command.type === 'exit') void document.exitFullscreen?.().catch(() => {})
  else channel.send({ type: 'command', command })
})

function goFullscreen() {
  hint.value = false
  void document.documentElement.requestFullscreen?.().catch(() => {})
}
</script>

<template>
  <div data-public class="fixed inset-0 cursor-none bg-black">
    <SlideStage :slides="slides" :ctx="ctx" :state="state" :waiting="!connected" />
    <FullscreenHint v-if="hint" @go="goFullscreen" />
  </div>
</template>
