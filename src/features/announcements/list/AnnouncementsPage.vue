<script setup lang="ts">
// Anuncios (RF-08): todos, con filtros.
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import ImportButton from '../../transfer/shared/ImportButton.vue'
import AnnouncementList from '../shared/AnnouncementList.vue'
import NewAnnouncementButton from '../shared/NewAnnouncementButton.vue'
import { useAnnouncementList } from '../shared/useAnnouncementList'
import AnnouncementFilters from './AnnouncementFilters.vue'

const { view, typeId, items, loaded, today } = useAnnouncementList()
</script>

<template>
  <UiPageHeader title="Anuncios">
    <div class="flex gap-2 md:hidden"><ImportButton icon /><NewAnnouncementButton icon /></div>
    <div class="hidden gap-2 md:flex"><ImportButton /><NewAnnouncementButton /></div>
  </UiPageHeader>
  <AnnouncementFilters v-model:view="view" v-model:type-id="typeId" />
  <AnnouncementList
    :items="items"
    :today="today"
    :loaded="loaded"
    :empty-message="view === 'activos' ? 'Todavía no hay anuncios activos.' : 'No hay anuncios pasados.'"
  />
</template>
