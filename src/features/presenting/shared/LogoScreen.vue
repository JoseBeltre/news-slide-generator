<script setup lang="ts">
// Pantalla de logo para las pausas (RF-62): el logo de la iglesia en blanco, centrado sobre negro.
import { computed } from 'vue'
import { logoCandidatesFor, logoUrlFor } from '../../../data/ministries'
import type { Ministry } from '../../../data/models'
import { selectLogoVariant } from '../../../slides/engine'

const props = defineProps<{ ministries: readonly Ministry[] }>()

const src = computed(() => {
  const candidates = logoCandidatesFor({ kind: 'iglesia' }, props.ministries)
  const choice = selectLogoVariant(candidates, '#000000', { orientation: 'vertical' })
  const source = choice && logoUrlFor(choice.candidate.id, props.ministries)
  return source?.kind === 'asset' ? source.src : undefined
})
</script>

<template>
  <div data-logo-screen class="flex size-full items-center justify-center bg-black">
    <img v-if="src" :src="src" alt="" class="h-1/3 w-auto" />
  </div>
</template>
