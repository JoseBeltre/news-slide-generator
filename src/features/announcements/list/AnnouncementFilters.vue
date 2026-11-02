<script setup lang="ts">
// Filtros de la lista: Activos / Pasados y un chip por tipo (RF-08).
import type { AnnouncementView } from '../../../data/announcements'
import { ANNOUNCEMENT_TYPES } from '../../../slides/types/definitions'
import UiChip from '../../../ui/UiChip.vue'
import UiChoiceGroup from '../../../ui/UiChoiceGroup.vue'
import TypeMark from '../shared/TypeMark.vue'

const view = defineModel<AnnouncementView>('view', { required: true })
const typeId = defineModel<string | undefined>('typeId')

const VIEWS = [
  { value: 'activos', label: 'Activos' },
  { value: 'pasados', label: 'Pasados' },
]
const toggle = (id: string) => (typeId.value = typeId.value === id ? undefined : id)
</script>

<template>
  <div class="flex flex-col gap-3 pb-4">
    <UiChoiceGroup
      :model-value="view"
      :options="VIEWS"
      label="Mostrar"
      @update:model-value="view = $event as AnnouncementView"
    />
    <div role="group" aria-label="Filtrar por tipo" class="flex flex-wrap gap-2">
      <UiChip :pressed="!typeId" @click="typeId = undefined">Todos</UiChip>
      <UiChip v-for="t in ANNOUNCEMENT_TYPES" :key="t.id" :pressed="typeId === t.id" @click="toggle(t.id)">
        <TypeMark :type-id="t.id" size="xs" />{{ t.name }}
      </UiChip>
    </div>
  </div>
</template>
