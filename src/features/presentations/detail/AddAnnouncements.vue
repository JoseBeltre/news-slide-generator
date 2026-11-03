<script setup lang="ts">
// Anuncios activos que aún no están en la presentación: los sugeridos primero (RF-52), luego el resto.
import { computed } from 'vue'
import { displayTitle, filterAnnouncements } from '../../../data/announcements'
import type { Announcement, Presentation } from '../../../data/models'
import { suggestedItems } from '../../../data/presentations'
import UiButton from '../../../ui/UiButton.vue'
import TypeMark from '../../announcements/shared/TypeMark.vue'

const props = defineProps<{ presentation: Presentation; announcements: Announcement[]; today: string }>()
defineEmits<{ add: [id: string] }>()

const options = computed(() => {
  const taken = new Set(props.presentation.items.map((i) => i.announcementId))
  const active = filterAnnouncements(props.announcements.filter((a) => !a.deletedAt), { view: 'activos', today: props.today })
  const suggested = new Set(suggestedItems(props.presentation.date, active).map((i) => i.announcementId))
  return [...active.filter((a) => suggested.has(a.id)), ...active.filter((a) => !suggested.has(a.id))]
    .filter((a) => !taken.has(a.id))
    .map((a) => ({ id: a.id, typeId: a.typeId, name: displayTitle(a) ?? 'Sin título' }))
})
</script>

<template>
  <section v-if="options.length" aria-labelledby="agregar-titulo" class="flex flex-col gap-2">
    <h2 id="agregar-titulo" class="font-meta text-meta uppercase text-ink-muted">Agregar anuncios</h2>
    <ul class="flex flex-col">
      <li v-for="o in options" :key="o.id" class="flex items-center gap-3 border-b border-hairline py-2">
        <TypeMark :type-id="o.typeId" size="xs" />
        <span class="min-w-0 flex-1 truncate text-ink">{{ o.name }}</span>
        <UiButton variant="ghost" :aria-label="`Agregar «${o.name}»`" @click="$emit('add', o.id)">Agregar</UiButton>
      </li>
    </ul>
  </section>
</template>
