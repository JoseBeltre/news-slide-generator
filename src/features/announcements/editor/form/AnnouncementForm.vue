<script setup lang="ts">
// Formulario generado desde los FieldDef del tipo (RF-01). Los errores de validación aparecen al
// salir del campo o al intentar guardar; los de "No cabe" (`flagged`), siempre (RF-10).
import { reactive } from 'vue'
import type { AnnouncementTypeDef } from '../../../../slides/types/fields'
import FieldControl from './FieldControl.vue'

const props = defineProps<{
  typeDef: AnnouncementTypeDef
  values: Record<string, unknown>
  errors: Record<string, string>
  /** Tras intentar guardar: se muestran todos los errores. */
  submitted?: boolean
  /** Campo → mensaje de "No cabe". */
  flagged?: Record<string, string>
}>()
const emit = defineEmits<{ 'update:field': [key: string, value: unknown]; blur: [fieldKey: string] }>()

const touched = reactive(new Set<string>())

const visible = (key: string) => props.submitted || touched.has(key)

function errorFor(key: string): string | undefined {
  return props.flagged?.[key] ?? (visible(key) ? props.errors[key] : undefined)
}

/** Errores de partes del campo ("personas.0.name" → "0.name"). */
function nestedErrorsFor(key: string): Record<string, string> {
  if (!visible(key)) return {}
  const prefix = `${key}.`
  return Object.fromEntries(
    Object.entries(props.errors).filter(([k]) => k.startsWith(prefix)).map(([k, m]) => [k.slice(prefix.length), m]),
  )
}

function onFocusOut(key: string) {
  touched.add(key)
  emit('blur', key)
}
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent>
    <p class="text-sm text-ink-muted">Los campos con * son obligatorios.</p>
    <div v-for="f in typeDef.fields" :key="f.key" @focusout="onFocusOut(f.key)">
      <FieldControl
        :field="f"
        :model-value="values[f.key]"
        :error="errorFor(f.key)"
        :nested-errors="nestedErrorsFor(f.key)"
        @update:model-value="emit('update:field', f.key, $event)"
      />
    </div>
  </form>
</template>
