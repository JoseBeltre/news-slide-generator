<script setup lang="ts">
// Marca del tipo: su ícono en tinta con una franja de su color (decorativa; el nombre va aparte).
import { computed } from 'vue'
import { typeVisual } from './typeVisual'

type Size = 'xs' | 'sm'
const props = withDefaults(defineProps<{ typeId: string; size?: Size }>(), { size: 'sm' })
const visual = computed(() => typeVisual(props.typeId))

const BOX: Record<Size, string> = { xs: 'size-6 border-l-2', sm: 'size-9 border-l-4' }
const ICON: Record<Size, number> = { xs: 14, sm: 18 }
</script>

<template>
  <span
    aria-hidden="true"
    :style="{ '--type-accent': visual.accent }"
    :class="['inline-flex shrink-0 items-center justify-center rounded-sm border-(--type-accent) bg-muted text-ink', BOX[size]]"
  >
    <component :is="visual.icon" v-if="visual.icon" :size="ICON[size]" />
  </span>
</template>
