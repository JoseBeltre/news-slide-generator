<script setup lang="ts">
// Configuración (RF-110, RF-111, §8.5): una página con índice y sus secciones. Cada cambio se guarda
// al momento y se sincroniza; Equipo solo existe si este build tiene nube.
import { computed } from 'vue'
import { useSync } from '../../data/sync/useSync'
import UiPageHeader from '../../ui/UiPageHeader.vue'
import SlidesSection from './SlidesSection.vue'
import StorageSection from './StorageSection.vue'
import TeamSection from './team/TeamSection.vue'
import TextsSection from './TextsSection.vue'

const sync = useSync()
const sections = computed(() => [
  { id: 'slides', label: 'Presentaciones y slides' },
  { id: 'textos', label: 'Textos por defecto' },
  ...(sync.value ? [{ id: 'equipo', label: 'Equipo' }] : []),
  { id: 'almacenamiento', label: 'Almacenamiento' },
])
</script>

<template>
  <div>
    <UiPageHeader title="Configuración" />
    <nav aria-label="Secciones" class="-mx-3 flex flex-wrap gap-1 pb-8">
      <a
        v-for="s in sections"
        :key="s.id"
        :href="`#${s.id}`"
        class="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-medium text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >{{ s.label }}</a>
    </nav>
    <SlidesSection />
    <TextsSection />
    <TeamSection v-if="sync" />
    <StorageSection />
  </div>
</template>
