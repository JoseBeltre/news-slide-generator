<script setup lang="ts">
// Vista del presentador (RF-62, RF-63): en la laptop, siempre en oscuro. Lo que se proyecta y lo
// que sigue, los puntos clave y las notas, los controles y la tira de miniaturas.
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { keyPoints } from '../../../data/presenting'
import { useForcedTheme } from '../../../ui/useTheme'
import CurrentAndNext from './CurrentAndNext.vue'
import Filmstrip from './Filmstrip.vue'
import KeyPoints from './KeyPoints.vue'
import PresenterBar from './PresenterBar.vue'
import { usePresenter } from './usePresenter'
import { usePresentingLock } from '../shared/usePresentingLock'

useForcedTheme('oscuro')
const route = useRoute()
usePresentingLock()
const { slides, ctx, byId, total, state, run, publicWindow } = usePresenter(computed(() => String(route.params.id)))
const opened = ref(false)
const current = computed(() => slides.value[state.value.index])
const points = computed(() => keyPoints(current.value, byId.value))

function openPublic() {
  opened.value = true
  void publicWindow.open()
}
</script>

<template>
  <div data-presenter class="fixed inset-0 flex flex-col gap-6 overflow-auto bg-background p-6 text-ink">
    <div class="grid flex-1 gap-6 lg:grid-cols-[3fr_2fr]">
      <CurrentAndNext :current="current" :next="slides[state.index + 1]" :ctx="ctx" :black="state.black" :logo="state.logo" />
      <KeyPoints :points="points" />
    </div>
    <PresenterBar :state="state" :total="total" :public-open="publicWindow.isOpen.value" :blocked="publicWindow.blocked.value" :opened="opened" @command="run" @open-public="openPublic" />
    <Filmstrip :slides="slides" :ctx="ctx" :current="state.index" @go="(index) => run({ type: 'goto', index })" />
  </div>
</template>
