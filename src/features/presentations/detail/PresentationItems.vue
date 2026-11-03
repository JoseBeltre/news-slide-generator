<script setup lang="ts">
// Anuncios de la presentación, en orden de proyección (RF-51): arrastrar o subir/bajar, y quitar.
import { X } from '@lucide/vue'
import { computed } from 'vue'
import { displayTitle } from '../../../data/announcements'
import type { Announcement, Presentation } from '../../../data/models'
import UiIconButton from '../../../ui/UiIconButton.vue'
import UiSortableList from '../../../ui/UiSortableList.vue'
import StatusBadge from '../../announcements/shared/StatusBadge.vue'
import TypeMark from '../../announcements/shared/TypeMark.vue'

const props = defineProps<{ items: Presentation['items']; byId: ReadonlyMap<string, Announcement>; today: string }>()
defineEmits<{ move: [from: number, to: number]; remove: [index: number] }>()

type Row = { key: string; announcement?: Announcement; name: string }
const rows = computed<Row[]>(() =>
  props.items.map(({ announcementId }) => {
    const a = props.byId.get(announcementId)
    const live = a && !a.deletedAt ? a : undefined
    return { key: announcementId, announcement: live, name: live ? (displayTitle(live) ?? 'Sin título') : 'Anuncio eliminado' }
  }),
)
</script>

<template>
  <UiSortableList :items="rows" :item-key="(r) => r.key" :item-label="(r) => r.name" label="Orden de los anuncios" @move="(f, t) => $emit('move', f, t)">
    <template #default="{ item, index }">
      <div class="flex items-center gap-3">
        <TypeMark v-if="item.announcement" :type-id="item.announcement.typeId" size="xs" />
        <RouterLink
          v-if="item.announcement"
          :to="{ name: 'editar', params: { id: item.key } }"
          class="min-w-0 flex-1 truncate font-medium text-ink hover:underline"
          >{{ item.name }}</RouterLink
        >
        <span v-else class="min-w-0 flex-1 text-ink-muted italic">{{ item.name }}</span>
        <StatusBadge v-if="item.announcement" :announcement="item.announcement" :today="today" />
        <UiIconButton :label="`Quitar «${item.name}»`" :icon="X" @click="$emit('remove', index)" />
      </div>
    </template>
  </UiSortableList>
</template>
