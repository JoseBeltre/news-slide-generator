<script setup lang="ts">
// Personas de un cumpleaños: una fila por persona y "Agregar persona" (empieza con la fecha de hoy).
import { Plus } from '@lucide/vue'
import type { Person } from '../../../../../slides/types/validation'
import UiButton from '../../../../../ui/UiButton.vue'
import type { ControlProps } from '../controlProps'
import { useListModel } from '../useListModel'
import PersonRow from './PersonRow.vue'

const props = defineProps<ControlProps>()
const emit = defineEmits<{ 'update:modelValue': [value: Person[] | undefined] }>()

const { items: people, set: emitPeople } = useListModel<Person>(() => props.modelValue, (next) => emit('update:modelValue', next))

function add() {
  const now = new Date()
  emitPeople([...people.value, { name: '', day: now.getDate(), month: now.getMonth() + 1 }])
}
const update = (i: number, p: Person) => emitPeople(people.value.map((old, j) => (j === i ? p : old)))
const remove = (i: number) => emitPeople(people.value.filter((_, j) => j !== i))

/** Errores de la persona i: los de sus campos y el de la fecha completa ("31 de febrero"). */
function errorsOf(i: number) {
  const e = props.nestedErrors ?? {}
  return { name: e[`${i}.name`], day: e[`${i}.day`] ?? e[`${i}`], month: e[`${i}.month`] }
}
</script>

<template>
  <div :id="id" data-people class="flex flex-col gap-3" :aria-describedby="describedBy" tabindex="-1">
    <PersonRow
      v-for="(p, i) in people"
      :key="i"
      :person="p"
      :index="i"
      :id-prefix="id"
      :errors="errorsOf(i)"
      @update="update(i, $event)"
      @remove="remove(i)"
    />
    <UiButton class="self-start" @click="add"><Plus :size="18" aria-hidden="true" />Agregar persona</UiButton>
  </div>
</template>
