<script setup lang="ts">
// Envoltura de un campo (DESIGN.md → Campos): etiqueta, "*", contador, ayuda y error con ícono.
// El control va en el slot, que recibe { describedBy, invalid } para sus atributos aria.
import { CircleAlert } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps<{
  id: string
  label: string
  required?: boolean
  count?: number
  max?: number
  hint?: string
  error?: string
}>()

const hintId = computed(() => `${props.id}-ayuda`)
const errorId = computed(() => `${props.id}-error`)
const describedBy = computed(() => [props.hint && hintId.value, props.error && errorId.value].filter(Boolean).join(' ') || undefined)

const counterTone = computed(() => {
  if (props.count === undefined || !props.max) return ''
  if (props.count >= props.max) return 'text-danger'
  return props.count >= props.max * 0.9 ? 'text-warning' : 'text-ink-muted'
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-3">
      <label :id="`${id}-etiqueta`" :for="id" data-field-label class="text-sm font-medium text-ink">
        {{ label }}<span v-if="required" aria-hidden="true"> *</span>
      </label>
      <span v-if="max" data-counter :class="['font-meta text-meta', counterTone]">{{ count ?? 0 }}/{{ max }}</span>
    </div>
    <slot :described-by="describedBy" :invalid="!!error" />
    <p v-if="hint" :id="hintId" class="text-sm text-ink-muted">{{ hint }}</p>
    <p v-if="error" :id="errorId" role="alert" class="flex items-start gap-1.5 text-sm text-danger">
      <CircleAlert :size="16" aria-hidden="true" class="mt-0.5 shrink-0" />{{ error }}
    </p>
  </div>
</template>
