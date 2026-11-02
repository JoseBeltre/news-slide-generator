<script setup lang="ts">
// Lista corta ("Qué llevar"): cada elemento es un chip. Enter o coma agrega; Backspace en vacío
// quita el último; al salir del campo se agrega lo que quedó escrito.
import { X } from '@lucide/vue'
import { ref } from 'vue'
import UiChip from '../../../../../ui/UiChip.vue'
import UiInput from '../../../../../ui/UiInput.vue'
import type { ControlProps } from '../controlProps'
import { useListModel } from '../useListModel'

const props = defineProps<ControlProps>()
const emit = defineEmits<{ 'update:modelValue': [value: string[] | undefined] }>()

const { items, set: emitItems } = useListModel<string>(() => props.modelValue, (next) => emit('update:modelValue', next))
const draft = ref('')

function commit() {
  const item = draft.value.replace(/,/g, '').trim()
  draft.value = ''
  if (item) emitItems([...items.value, item])
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    commit()
  } else if (e.key === 'Backspace' && draft.value === '' && items.value.length) {
    emitItems(items.value.slice(0, -1))
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <ul v-if="items.length" class="flex flex-wrap gap-2">
      <li v-for="(item, i) in items" :key="`${i}-${item}`">
        <UiChip :aria-label="`Quitar ${item}`" @click="emitItems(items.filter((_, j) => j !== i))">
          {{ item }}<X :size="14" aria-hidden="true" />
        </UiChip>
      </li>
    </ul>
    <UiInput
      :id="id"
      v-model="draft"
      placeholder="Escribe y pulsa Enter"
      enterkeyhint="done"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @keydown="onKeydown"
      @blur="commit"
    />
  </div>
</template>
