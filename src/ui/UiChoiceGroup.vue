<script setup lang="ts">
// Botones de opción (una sola elegida). Se usa para pestañas, campos "choice", el estilo de la slide
// y el formato de fecha. Con teclado: Tab entra al grupo y las flechas cambian la opción.
// En la variante segmentada, el fondo de la opción elegida se desliza a la nueva (solo transform).
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
const thumb = ref<{ x: number; y: number; w: number; h: number } | null>(null)
/** Falso hasta la primera medida: el fondo aparece en su sitio sin deslizarse desde el 0. */
const settled = ref(false)

function measure() {
  const el = buttons.value[selectedIndex()]
  thumb.value = el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null
}
onMounted(async () => {
  if (props.variant !== 'segmented') return
  measure()
  window.addEventListener('resize', measure)
  await nextTick()
  requestAnimationFrame(() => (settled.value = true))
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
watch(() => [props.modelValue, props.options], () => props.variant === 'segmented' && nextTick(measure))
const selectedIndex = () => Math.max(0, props.options.findIndex((o) => o.value === props.modelValue))

function move(step: number) {
  const next = (selectedIndex() + step + props.options.length) % props.options.length
  emit('update:modelValue', props.options[next]!.value)
  buttons.value[next]?.focus()
}

const GROUP = {
  segmented: 'relative inline-flex w-fit flex-wrap gap-1 rounded-md border border-field-border bg-surface p-1',
  cards: 'grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]',
}
const OPTION = {
  segmented: 'relative z-10 h-11 rounded-sm px-3 text-sm font-medium transition-colors duration-180 ease-out md:h-9 aria-checked:text-on-primary',
  cards:
    'flex flex-col items-start gap-1 rounded-md border border-field-border bg-surface p-3 text-left transition-[border-color,transform] duration-150 ease-out aria-checked:border-2 aria-checked:border-ink',
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
    <span
      v-if="variant === 'segmented' && thumb"
      aria-hidden="true"
      data-choice-thumb
      :style="{ transform: `translate(${thumb.x}px, ${thumb.y}px)`, width: `${thumb.w}px`, height: `${thumb.h}px` }"
      :class="['pointer-events-none absolute top-0 left-0 rounded-sm bg-primary', settled && 'transition-[transform,width,height] duration-220 ease-out-soft motion-reduce:transition-none']"
    />
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
        'cursor-pointer text-ink active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        variant === 'cards' ? 'hover:bg-muted' : 'hover:bg-muted aria-checked:hover:bg-transparent',
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
