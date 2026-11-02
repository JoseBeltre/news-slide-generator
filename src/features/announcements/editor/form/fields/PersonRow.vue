<script setup lang="ts">
// Una persona de cumpleaños: nombre, día y mes (nunca año ni edad, §3.3) y foto opcional.
import { Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { monthName } from '../../../../../lib/format'
import type { FieldDef } from '../../../../../slides/types/fields'
import type { Person } from '../../../../../slides/types/validation'
import UiIconButton from '../../../../../ui/UiIconButton.vue'
import UiInput from '../../../../../ui/UiInput.vue'
import UiSelect from '../../../../../ui/UiSelect.vue'
import FieldImage from './FieldImage.vue'

const props = defineProps<{ person: Person; index: number; idPrefix: string }>()
const emit = defineEmits<{ update: [person: Person]; remove: [] }>()

const DAYS = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es-DO') + s.slice(1).toLocaleLowerCase('es-DO')
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: capitalize(monthName(i + 1)) }))

const n = computed(() => props.index + 1)
const id = (part: string) => `${props.idPrefix}-${n.value}-${part}`
const photoField = computed<FieldDef>(() => ({ key: `persona-${n.value}-foto`, label: 'Foto', kind: 'image', required: false }))
const set = (patch: Partial<Person>) => emit('update', { ...props.person, ...patch })
const label = 'mb-1 block text-sm font-medium text-ink'
</script>

<template>
  <fieldset class="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-hairline bg-surface p-3 sm:grid-cols-[2fr_1fr_1.5fr_auto]">
    <legend class="sr-only">Persona {{ n }}</legend>
    <div class="col-span-2 sm:col-span-1">
      <label :for="id('nombre')" :class="label">Nombre</label>
      <UiInput :id="id('nombre')" data-person-name :model-value="person.name" @update:model-value="set({ name: $event ?? '' })" />
    </div>
    <div>
      <label :for="id('dia')" :class="label">Día</label>
      <UiSelect :id="id('dia')" :options="DAYS" :model-value="String(person.day)" @update:model-value="set({ day: Number($event) })" />
    </div>
    <div>
      <label :for="id('mes')" :class="label">Mes</label>
      <UiSelect :id="id('mes')" :options="MONTHS" :model-value="String(person.month)" @update:model-value="set({ month: Number($event) })" />
    </div>
    <UiIconButton :label="`Quitar a ${person.name || `la persona ${n}`}`" :icon="Trash2" variant="danger" class="self-end" @click="emit('remove')" />
    <div class="col-span-2 sm:col-span-4">
      <span class="mb-1 block text-sm font-medium text-ink">Foto (opcional)</span>
      <FieldImage
        :id="id('foto')"
        :field="photoField"
        :model-value="person.photoId"
        :invalid="false"
        @update:model-value="set({ photoId: $event })"
      />
    </div>
  </fieldset>
</template>
