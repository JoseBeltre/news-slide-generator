<script setup lang="ts">
// Fila de un anuncio (Inicio y Anuncios): tipo, título, fecha, estado y un menú de tres puntos con sus
// acciones (Duplicar, Exportar, Eliminar…). Tocarla abre el editor.
import { Copy, Download, EyeOff, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { displayTitle } from '../../../data/announcements'
import type { Announcement } from '../../../data/models'
import { formatEventDate } from '../../../lib/format'
import UiMenu, { type MenuItem } from '../../../ui/UiMenu.vue'
import { useExport } from '../../transfer/shared/useExport'
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
const { run: exportNow } = useExport('anuncio', () => props.announcement.id)

const ACTIONS: MenuItem[] = [
  { key: 'duplicate', label: 'Duplicar', icon: Copy },
  { key: 'export', label: 'Exportar', icon: Download },
  { key: 'remove', label: 'Eliminar…', icon: Trash2, danger: true, separatorBefore: true },
]
function onSelect(key: string) {
  if (key === 'duplicate') emit('duplicate')
  else if (key === 'export') void exportNow()
  else emit('remove')
}
</script>

<template>
  <div data-announcement-row class="relative flex items-center gap-3 border-b border-hairline py-3">
    <TypeMark :type-id="announcement.typeId" />
    <RouterLink
      :to="{ name: 'editar', params: { id: announcement.id } }"
      class="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <!-- El ojo tachado va pegado al final del nombre, también cuando el nombre se parte en dos líneas. -->
      <span :class="['line-clamp-2 text-base/snug font-medium', title ? 'text-ink' : 'text-ink-muted']">
        <span data-title>{{ name }}</span>
        <span v-if="announcement.showPublic === false" data-hidden-public class="ml-1.5 inline-block align-[-2px] text-ink-muted">
          <EyeOff :size="16" aria-hidden="true" /><span class="sr-only">Oculto al público</span>
        </span>
      </span>
      <span class="sr-only">, {{ typeVisual(announcement.typeId).name }}</span>
      <span class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span v-if="date" class="font-meta text-meta whitespace-nowrap uppercase text-ink-muted">{{ date }}</span>
        <StatusBadge :announcement="announcement" />
      </span>
    </RouterLink>
    <UiMenu class="-mr-1.5" :label="`Acciones de «${name}»`" :items="ACTIONS" @select="onSelect" />
  </div>
</template>
