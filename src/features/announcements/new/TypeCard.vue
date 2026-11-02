<script setup lang="ts">
// Tarjeta de un tipo en el paso 1: ícono, nombre, descripción y el número de su atajo.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { typeVisual } from '../shared/typeVisual'
import { TYPE_DESCRIPTIONS } from './typeDescriptions'
import type { AnnouncementTypeId } from '../../../slides/types/fields'

const props = defineProps<{ typeId: AnnouncementTypeId; shortcut: number }>()
const visual = computed(() => typeVisual(props.typeId))
</script>

<template>
  <RouterLink
    :to="{ name: 'nuevo-tipo', params: { typeId } }"
    :data-type-card="typeId"
    :aria-keyshortcuts="String(shortcut)"
    :style="{ '--type-accent': visual.accent }"
    class="relative flex flex-col gap-2 rounded-md border border-hairline border-t-4 border-t-(--type-accent) bg-surface p-3 text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:gap-3 md:p-4"
  >
    <component :is="visual.icon" v-if="visual.icon" :size="28" aria-hidden="true" />
    <span data-name class="font-display text-xl leading-tight md:text-heading-sm">{{ visual.name }}</span>
    <span class="hidden text-sm text-ink-muted sm:block">{{ TYPE_DESCRIPTIONS[typeId] }}</span>
    <kbd aria-hidden="true" class="absolute top-3 right-3 font-meta text-meta text-ink-muted">{{ shortcut }}</kbd>
  </RouterLink>
</template>
