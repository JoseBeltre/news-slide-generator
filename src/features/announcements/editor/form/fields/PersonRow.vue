<script setup lang="ts">
// Una persona de cumpleaños: nombre, día y mes (nunca año ni edad, §3.3) y foto opcional.
// Cada parte es un UiField: su etiqueta y su error, como el resto del formulario.
import { Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { monthName } from '../../../../../lib/format'
import type { FieldDef } from '../../../../../slides/types/fields'
import type { Person } from '../../../../../slides/types/validation'
import UiField from '../../../../../ui/UiField.vue'
import UiIconButton from '../../../../../ui/UiIconButton.vue'
import UiInput from '../../../../../ui/UiInput.vue'
import UiSelect from '../../../../../ui/UiSelect.vue'
import FieldImage from './FieldImage.vue'

const props = defineProps<{
  person: Person
  index: number
  idPrefix: string
  errors: { name?: string; day?: string; month?: string }
}>()
const emit = defineEmits<{ update: [person: Person]; remove: [] }>()

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es-DO') + s.slice(1).toLocaleLowerCase('es-DO')
const DAYS = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: capitalize(monthName(i + 1)) }))

const n = computed(() => props.index + 1)
const id = (part: string) => `${props.idPrefix}-${n.value}-${part}`
const photoField = computed<FieldDef>(() => ({ key: `persona-${n.value}-foto`, label: 'Foto', kind: 'image', required: false }))
const set = (patch: Partial<Person>) => emit('update', { ...props.person, ...patch })
</script>

<template>
  <fieldset class="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-hairline bg-surface p-3 sm:grid-cols-[2fr_1fr_1.5fr_auto]">
    <legend class="sr-only">Persona {{ n }}</legend>
    <UiField :id="id('nombre')" label="Nombre" :error="errors.name" class="col-span-2 sm:col-span-1">
      <template #default="{ describedBy, invalid }">
        <UiInput
          :id="id('nombre')"
          data-person-name
          :model-value="person.name"
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
          @update:model-value="set({ name: $event ?? '' })"
        />
      </template>
    </UiField>
    <UiField :id="id('dia')" label="Día" :error="errors.day">
      <template #default="{ describedBy, invalid }">
        <UiSelect
          :id="id('dia')"
          :options="DAYS"
          :model-value="String(person.day)"
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
          @update:model-value="set({ day: Number($event) })"
        />
      </template>
    </UiField>
    <UiField :id="id('mes')" label="Mes" :error="errors.month">
      <template #default="{ describedBy, invalid }">
        <UiSelect
          :id="id('mes')"
          :options="MONTHS"
          :model-value="String(person.month)"
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
          @update:model-value="set({ month: Number($event) })"
        />
      </template>
    </UiField>
    <UiIconButton :label="`Quitar a ${person.name || `la persona ${n}`}`" :icon="Trash2" variant="danger" class="mt-7" @click="emit('remove')" />
    <UiField :id="id('foto')" label="Foto (opcional)" class="col-span-2 sm:col-span-4">
      <FieldImage
        :id="id('foto')"
        :field="photoField"
        :model-value="person.photoId"
        :invalid="false"
        :remove-label="`Quitar la foto de ${person.name || `la persona ${n}`}`"
        @update:model-value="set({ photoId: $event })"
      />
    </UiField>
  </fieldset>
</template>
