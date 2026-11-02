<script setup lang="ts">
// Botones de opción (una sola elegida). Se usa para pestañas, campos "choice", el estilo de la slide
// y el formato de fecha. Con teclado: Tab entra al grupo y las flechas cambian la opción.
import { ref } from 'vue'

export interface ChoiceOption {
  value: string
  label: string
  hint?: string
  /** Muestra de color junto a la etiqueta (temas). */
  swatch?: string
}

const props = withDefaults(
  defineProps<{ modelValue: string | undefined; options: readonly ChoiceOption[]; label: string; variant?: 'segmented' | 'cards' }>(),
  { variant: 'segmented' },
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const buttons = ref<HTMLButtonElement[]>([])
const selectedIndex = () => Math.max(0, props.options.findIndex((o) => o.value === props.modelValue))

function move(step: number) {
  const next = (selectedIndex() + step + props.options.length) % props.options.length
  emit('update:modelValue', props.options[next]!.value)
  buttons.value[next]?.focus()
}

const GROUP = {
  segmented: 'inline-flex w-fit flex-wrap gap-1 rounded-md border border-field-border bg-surface p-1',
  cards: 'grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]',
}
const OPTION = {
  segmented: 'h-9 rounded-sm px-3 text-sm font-medium aria-checked:bg-primary aria-checked:text-on-primary',
  cards:
    'flex flex-col items-start gap-1 rounded-md border border-field-border bg-surface p-3 text-left aria-checked:border-2 aria-checked:border-ink',
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    :class="GROUP[variant]"
    @keydown.right.prevent="move(1)"
    @keydown.down.prevent="move(1)"
    @keydown.left.prevent="move(-1)"
    @keydown.up.prevent="move(-1)"
  >
    <button
      v-for="(option, i) in options"
      :key="option.value"
      ref="buttons"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :tabindex="i === selectedIndex() ? 0 : -1"
      :class="[
        OPTION[variant],
        'text-ink hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
      ]"
      @click="emit('update:modelValue', option.value)"
    >
      <span class="inline-flex items-center gap-2">
        <span
          v-if="option.swatch"
          aria-hidden="true"
          :style="{ '--swatch': option.swatch }"
          class="size-4 shrink-0 rounded-full border border-hairline bg-(--swatch)"
        />{{ option.label }}
      </span>
      <span v-if="option.hint" class="text-sm text-ink-muted">{{ option.hint }}</span>
    </button>
  </div>
</template>
