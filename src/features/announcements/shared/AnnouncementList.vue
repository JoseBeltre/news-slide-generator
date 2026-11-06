<script setup lang="ts">
// Lista de filas con sus acciones, o el estado vacío. La usan Inicio y Anuncios. Mientras carga, filas de
// relleno; las filas entran escalonadas (solo la primera carga), lo nuevo se resalta y al borrar la fila
// colapsa y se desvanece.
import { computed } from 'vue'
import type { Announcement } from '../../../data/models'
import UiEmptyState from '../../../ui/UiEmptyState.vue'
import AnnouncementRow from './AnnouncementRow.vue'
import AnnouncementSkeleton from './AnnouncementSkeleton.vue'
import NewAnnouncementButton from './NewAnnouncementButton.vue'
import { useAnnouncementActions } from './useAnnouncementActions'
import { useRowMotion } from './useRowMotion'

const props = defineProps<{ items: Announcement[]; today: string; loaded: boolean; emptyMessage: string }>()
const { duplicateAndOpen, remove } = useAnnouncementActions()
const { stagger, settled, highlighted, delayOf } = useRowMotion(
  () => props.items.map((a) => a.id),
  () => props.loaded,
)

// Entrar: fundido + 8 px (240 ms); con "reducir movimiento", solo fundido. En la primera carga de la
// sesión entran escalonadas; en las demás ya están ahí, sin animar.
const enterClass = computed(() => (stagger || settled.value ? 'motion-safe:animate-row-in motion-reduce:animate-fade-in' : ''))
</script>

<template>
  <AnnouncementSkeleton v-if="!loaded" />
  <TransitionGroup
    v-else-if="items.length"
    tag="ul"
    appear
    class="border-t border-hairline"
    :enter-active-class="enterClass"
    :appear-active-class="stagger ? 'motion-safe:animate-row-in motion-reduce:animate-fade-in' : ''"
    leave-active-class="transition-[grid-template-rows,opacity] duration-200 ease-in motion-reduce:duration-200"
    leave-to-class="grid-rows-[0fr]! opacity-0 motion-reduce:grid-rows-[1fr]!"
  >
    <li v-for="(a, i) in items" :key="a.id" class="grid grid-rows-[1fr]" :style="{ animationDelay: delayOf(i) }">
      <div class="relative min-h-0 overflow-hidden">
        <span
          v-if="highlighted.has(a.id)"
          data-new-highlight
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-0 inset-y-0.5 rounded-md bg-warning/30 opacity-0 animate-highlight"
        />
        <AnnouncementRow :announcement="a" :today="today" @duplicate="duplicateAndOpen(a)" @remove="remove(a)" />
      </div>
    </li>
  </TransitionGroup>
  <UiEmptyState v-else :message="emptyMessage">
    <NewAnnouncementButton />
  </UiEmptyState>
</template>
