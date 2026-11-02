<script setup lang="ts">
// Lista de filas con sus acciones, o el estado vacío. La usan Inicio y Anuncios.
import type { Announcement } from '../../../data/models'
import UiEmptyState from '../../../ui/UiEmptyState.vue'
import AnnouncementRow from './AnnouncementRow.vue'
import NewAnnouncementButton from './NewAnnouncementButton.vue'
import { useAnnouncementActions } from './useAnnouncementActions'

defineProps<{ items: Announcement[]; today: string; loaded: boolean; emptyMessage: string }>()
const { duplicateAndOpen, remove } = useAnnouncementActions()
</script>

<template>
  <ul v-if="items.length" class="border-t border-hairline">
    <AnnouncementRow
      v-for="a in items"
      :key="a.id"
      :announcement="a"
      :today="today"
      @duplicate="duplicateAndOpen(a)"
      @remove="remove(a)"
    />
  </ul>
  <UiEmptyState v-else-if="loaded" :message="emptyMessage">
    <NewAnnouncementButton />
  </UiEmptyState>
</template>
