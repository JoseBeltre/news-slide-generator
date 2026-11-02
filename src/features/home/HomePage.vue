<script setup lang="ts">
// Inicio (SRS §6.1): los próximos anuncios. La presentación del sábado llega en P5.
import UiButton from '../../ui/UiButton.vue'
import UiPageHeader from '../../ui/UiPageHeader.vue'
import AnnouncementList from '../announcements/shared/AnnouncementList.vue'
import NewAnnouncementButton from '../announcements/shared/NewAnnouncementButton.vue'
import { useAnnouncementList } from '../announcements/shared/useAnnouncementList'

const UPCOMING = 8
const { items, loaded, today } = useAnnouncementList({ limit: UPCOMING })
</script>

<template>
  <UiPageHeader title="Próximos anuncios">
    <NewAnnouncementButton />
  </UiPageHeader>
  <AnnouncementList :items="items" :today="today" :loaded="loaded" empty-message="Todavía no hay anuncios activos." />
  <div v-if="items.length" class="pt-4">
    <UiButton variant="ghost" :to="{ name: 'anuncios' }">Ver todos</UiButton>
  </div>
</template>
