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

function errorFor(key: string): string | undefined {
  return props.flagged?.[key] ?? (props.submitted || touched.has(key) ? props.errors[key] : undefined)
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
        @update:model-value="emit('update:field', f.key, $event)"
      />
    </div>
  </form>
</template>
