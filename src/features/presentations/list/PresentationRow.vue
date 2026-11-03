<script setup lang="ts">
// Fila de una presentación: fecha y número de anuncios; tocarla la abre.
import { Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Presentation } from '../../../data/models'
import { formatDate } from '../../../lib/format'
import UiIconButton from '../../../ui/UiIconButton.vue'

const props = defineProps<{ presentation: Presentation }>()
defineEmits<{ remove: [] }>()

const date = computed(() => formatDate(props.presentation.date))
const count = computed(() => {
  const n = props.presentation.items.length
  return n === 1 ? '1 anuncio' : `${n} anuncios`
})
</script>

<template>
  <li data-presentation-row class="flex items-center gap-3 border-b border-hairline py-3">
    <RouterLink
      :to="{ name: 'presentacion', params: { id: presentation.id } }"
      class="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span class="block font-medium text-ink">{{ date }}</span>
      <span class="font-meta text-meta uppercase text-ink-muted">{{ count }}</span>
    </RouterLink>
    <UiIconButton :label="`Eliminar la presentación del ${date.toLowerCase()}`" :icon="Trash2" variant="danger" @click="$emit('remove')" />
  </li>
</template>
