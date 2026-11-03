<script setup lang="ts" generic="T">
// Lista ordenable (RF-51): se arrastra la fila (laptop) o se usan "Subir"/"Bajar" (teclado, celular).
// No cambia `items`: emite move(from, to) y el padre decide. El foco sigue a la fila movida.
import { ChevronDown, ChevronUp, GripVertical } from '@lucide/vue'
import { nextTick, ref, watch } from 'vue'
import UiIconButton from './UiIconButton.vue'

const props = defineProps<{
  items: readonly T[]
  itemKey: (item: T) => string
  itemLabel: (item: T) => string
  label: string
}>()
const emit = defineEmits<{ move: [from: number, to: number] }>()

const list = ref<HTMLOListElement>()
const dragging = ref<number>()
const over = ref<number>()
let refocus: { key: string; dir: 'Subir' | 'Bajar' } | undefined

function step(index: number, dir: 'Subir' | 'Bajar') {
  refocus = { key: props.itemKey(props.items[index]!), dir }
  emit('move', index, dir === 'Subir' ? index - 1 : index + 1)
}

watch(
  () => props.items,
  async () => {
    if (!refocus) return
    const { key, dir } = refocus
    refocus = undefined
    await nextTick()
    const row = list.value?.querySelector(`[data-key="${CSS.escape(key)}"]`)
    // Si la flecha quedó deshabilitada (primera o última fila), el foco va a la otra flecha: nunca a
    // otro botón de la fila, que podría ser una acción destructiva como "Quitar".
    const arrows = [...(row?.querySelectorAll<HTMLButtonElement>('[data-arrow]') ?? [])].filter((b) => !b.disabled)
    ;(arrows.find((b) => b.dataset.arrow === dir) ?? arrows[0])?.focus()
  },
)

function drop(index: number) {
  if (dragging.value !== undefined && dragging.value !== index) emit('move', dragging.value, index)
  dragging.value = over.value = undefined
}
</script>

<template>
  <ol ref="list" :aria-label="label" class="flex flex-col">
    <li
      v-for="(item, i) in items"
      :key="itemKey(item)"
      :data-key="itemKey(item)"
      draggable="true"
      :data-dragging="dragging === i || undefined"
      :data-over="(over === i && dragging !== i) || undefined"
      class="flex items-center gap-2 border-b border-hairline py-2 data-dragging:opacity-50 data-over:border-t-2 data-over:border-t-ink"
      @dragstart="dragging = i"
      @dragover.prevent="over = i"
      @dragleave="over = over === i ? undefined : over"
      @drop.prevent="drop(i)"
      @dragend="dragging = over = undefined"
    >
      <GripVertical :size="18" aria-hidden="true" class="shrink-0 cursor-grab text-ink-muted" />
      <div class="min-w-0 flex-1"><slot :item="item" :index="i" /></div>
      <UiIconButton :label="`Subir «${itemLabel(item)}»`" :icon="ChevronUp" data-arrow="Subir" :disabled="i === 0" @click="step(i, 'Subir')" />
      <UiIconButton :label="`Bajar «${itemLabel(item)}»`" :icon="ChevronDown" data-arrow="Bajar" :disabled="i === items.length - 1" @click="step(i, 'Bajar')" />
    </li>
  </ol>
</template>
