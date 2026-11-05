<script setup lang="ts">
// Una tarjeta de la página pública (mockup aprobado v2): número con el color del tipo y el tipo arriba,
// luego el título (18 px) y cada dato con su ícono (15 px), a todo el ancho para que no se parta.
import { computed } from 'vue'
import { iconFor } from '../slides/icons'
import { TYPE_ACCENTS } from '../slides/themes'
import type { AnnouncementTypeId } from '../slides/types/fields'
import type { NoticeCard } from './types'

const props = defineProps<{ card: NoticeCard }>()
const accent = computed(() => TYPE_ACCENTS[props.card.typeId as AnnouncementTypeId])
</script>

<template>
  <li data-notice-card class="rounded-xl border border-hairline bg-surface px-4 py-3" :style="{ '--type-accent': accent }">
    <p class="flex items-center gap-2">
      <span data-number class="inline-flex size-6 items-center justify-center rounded-md bg-(--type-accent)/35 font-meta text-meta text-ink">
        {{ card.number }}
      </span>
      <span class="font-meta text-meta uppercase text-ink-muted">{{ card.typeName }}</span>
    </p>
    <h2 class="mt-1.5 text-lg/snug font-medium text-ink">{{ card.title }}</h2>
    <ul class="mt-1 flex flex-col gap-1">
      <li v-for="(row, i) in card.rows" :key="i" data-row class="flex items-start gap-2 text-[15px]/snug text-ink">
        <component :is="iconFor(row.icon)" v-if="iconFor(row.icon)" :size="16" aria-hidden="true" class="mt-0.5 shrink-0 text-ink-muted" />
        <span class="min-w-0 break-words">{{ row.text }}</span>
      </li>
    </ul>
  </li>
</template>
