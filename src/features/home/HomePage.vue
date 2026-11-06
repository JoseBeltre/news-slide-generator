<script setup lang="ts">
// Inicio (SRS §6.1): la presentación del sábado y los próximos anuncios.
import UiButton from '../../ui/UiButton.vue'
import UiPageHeader from '../../ui/UiPageHeader.vue'
import AnnouncementList from '../announcements/shared/AnnouncementList.vue'
import NewAnnouncementButton from '../announcements/shared/NewAnnouncementButton.vue'
import { useAnnouncementList } from '../announcements/shared/useAnnouncementList'
import ImportButton from '../transfer/shared/ImportButton.vue'
import NextPresentationCard from '../presentations/shared/NextPresentationCard.vue'
import ShareNoticesButton from './ShareNoticesButton.vue'

const UPCOMING = 8
const { items, loaded, today } = useAnnouncementList({ limit: UPCOMING })
</script>

<template>
  <UiPageHeader title="Próximos anuncios">
    <!-- Solo icono en el celular (no caben juntos); con texto desde md, como en Presentaciones. -->
    <div class="flex gap-2 md:hidden"><ImportButton icon /><NewAnnouncementButton icon /></div>
    <div class="hidden gap-2 md:flex"><ImportButton /><NewAnnouncementButton /></div>
  </UiPageHeader>
  <NextPresentationCard />
  <ShareNoticesButton />
  <AnnouncementList :items="items" :today="today" :loaded="loaded" empty-message="Todavía no hay anuncios activos." />
  <div v-if="items.length" class="pt-4">
    <UiButton variant="ghost" :to="{ name: 'anuncios' }">Ver todos</UiButton>
  </div>
</template>
