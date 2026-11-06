<script setup lang="ts">
// Marca del tipo: su ícono en tinta con una franja de su color (decorativa; el nombre va aparte).
import { computed } from 'vue'
import { typeVisual } from './typeVisual'

type Size = 'xs' | 'sm'
const props = withDefaults(defineProps<{ typeId: string; size?: Size }>(), { size: 'sm' })
const visual = computed(() => typeVisual(props.typeId))

const BOX: Record<Size, string> = {
  xs: 'size-6 rounded-sm border-l-2 border-(--type-accent) bg-muted',
  sm: 'size-10 rounded-md bg-(--type-accent)/40',
}
const ICON: Record<Size, number> = { xs: 14, sm: 20 }
</script>

<template>
  <span
    aria-hidden="true"
    :style="{ '--type-accent': visual.accent }"
    :class="['inline-flex shrink-0 items-center justify-center text-ink', BOX[size]]"
  >
    <component :is="visual.icon" v-if="visual.icon" :size="ICON[size]" />
  </span>
</template>
