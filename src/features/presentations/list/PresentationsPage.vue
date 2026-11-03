<script setup lang="ts">
// Presentaciones (RF-50): crear la de una fecha y ver las próximas y las pasadas.
import UiEmptyState from '../../../ui/UiEmptyState.vue'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import { usePresentations } from '../shared/usePresentations'
import NewPresentationForm from './NewPresentationForm.vue'
import PresentationGroup from './PresentationGroup.vue'

const { upcoming, past, loaded, today, openOrCreate, remove } = usePresentations()
</script>

<template>
  <UiPageHeader title="Presentaciones" />
  <NewPresentationForm :today="today" @create="openOrCreate" />
  <PresentationGroup title="Próximas" :items="upcoming" @remove="remove" />
  <PresentationGroup title="Pasadas" :items="past" @remove="remove" />
  <UiEmptyState v-if="loaded && !upcoming.length && !past.length" message="Todavía no hay presentaciones." />
</template>
