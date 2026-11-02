<script setup lang="ts">
// Fila de un anuncio (Inicio y Anuncios): tipo, título, fecha, estado y acciones. Tocarla abre el editor.
import { Copy, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { displayTitle } from '../../../data/announcements'
import type { Announcement } from '../../../data/models'
import { formatEventDate } from '../../../lib/format'
import UiIconButton from '../../../ui/UiIconButton.vue'
import StatusBadge from './StatusBadge.vue'
import TypeMark from './TypeMark.vue'
import { typeVisual } from './typeVisual'

const props = defineProps<{ announcement: Announcement; today: string }>()
const emit = defineEmits<{ duplicate: []; remove: [] }>()

const title = computed(() => displayTitle(props.announcement))
const name = computed(() => title.value ?? 'Sin título')
const date = computed(() => {
  const iso = props.announcement.eventDate
  return iso ? formatEventDate(iso, { style: 'medio', reference: props.today }) : undefined
})
</script>

<template>
  <li data-announcement-row class="flex items-center gap-3 border-b border-hairline py-3">
    <TypeMark :type-id="announcement.typeId" />
    <RouterLink
      :to="{ name: 'editar', params: { id: announcement.id } }"
      class="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span data-title :class="['block truncate font-medium', title ? 'text-ink' : 'text-ink-muted']">{{ name }}</span>
      <span class="sr-only">, {{ typeVisual(announcement.typeId).name }}</span>
      <span v-if="date" class="font-meta text-meta uppercase text-ink-muted">{{ date }}</span>
    </RouterLink>
    <StatusBadge :announcement="announcement" :today="today" />
    <UiIconButton :label="`Duplicar «${name}»`" :icon="Copy" @click="emit('duplicate')" />
    <UiIconButton :label="`Eliminar «${name}»`" :icon="Trash2" variant="danger" @click="emit('remove')" />
  </li>
</template>
