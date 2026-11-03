<script setup lang="ts">
// Un grupo de la lista ("Próximas" o "Pasadas"); no se muestra si está vacío.
import type { Presentation } from '../../../data/models'
import PresentationRow from './PresentationRow.vue'

defineProps<{ title: string; items: Presentation[] }>()
defineEmits<{ remove: [p: Presentation] }>()
</script>

<template>
  <section v-if="items.length" class="pb-8">
    <h2 class="pb-2 font-meta text-meta uppercase text-ink-muted">{{ title }}</h2>
    <ul>
      <PresentationRow v-for="p in items" :key="p.id" :presentation="p" @remove="$emit('remove', p)" />
    </ul>
  </section>
</template>
