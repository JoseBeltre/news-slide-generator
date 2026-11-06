<script setup lang="ts">
// Envoltura de un campo (DESIGN.md → Campos): etiqueta, "*", contador, ayuda (ícono con tooltip) y error con
// ícono. El control va en el slot, que recibe { describedBy, invalid } para sus atributos aria. Un error
// nuevo sacude el campo 200 ms y su mensaje entra con un fundido.
import { CircleAlert, CircleHelp } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import UiCollapse from './UiCollapse.vue'

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

// Ayuda: se abre con el toque, el foco o el cursor; Esc o salir la cierra.
const tip = ref(false)
// El mensaje se queda mientras la zona se cierra, para que no se vacíe a mitad de animación.
const shownError = ref(props.error)
const shaking = ref(false)
watch(
  () => props.error,
  (now, before) => {
    if (now) shownError.value = now
    if (now && !before) shaking.value = true
  },
)
</script>

<template>
  <!-- Sin gap: el error plegado no deja hueco bajo el control (un botón al lado queda alineado). -->
  <div class="flex flex-col">
    <div class="relative mb-1.5 flex min-h-6 items-center">
      <label :id="`${id}-etiqueta`" :for="id" data-field-label class="text-sm font-medium text-ink">
        {{ label }}<span v-if="required" aria-hidden="true"> *</span>
      </label>
      <button
        v-if="hint"
        type="button"
        data-field-help
        :aria-label="`Ayuda: ${label}`"
        :aria-expanded="tip"
        :aria-describedby="hintId"
        class="-my-2.5 -ml-1 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink-muted transition-[color,transform] duration-150 ease-out hover:text-ink active:scale-97 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ink aria-expanded:text-ink"
        @click="tip = !tip"
        @mouseenter="tip = true"
        @mouseleave="tip = false"
        @blur="tip = false"
        @keydown.escape="tip = false"
      >
        <CircleHelp :size="18" aria-hidden="true" />
      </button>
      <span v-if="max" data-counter :class="['ml-auto font-meta text-meta', counterTone]">{{ count ?? 0 }}/{{ max }}</span>
      <Transition
        enter-active-class="motion-safe:animate-tip-in motion-reduce:animate-fade-in"
        leave-active-class="motion-safe:animate-tip-out motion-reduce:animate-fade-out"
      >
        <p v-if="hint" v-show="tip" :id="hintId" role="tooltip" class="pointer-events-none absolute inset-x-0 top-full z-20 mt-0.5 rounded-md bg-ink px-3 py-2.5 text-sm/snug text-background">
          {{ hint }}
        </p>
      </Transition>
    </div>
    <div :class="shaking && 'motion-safe:animate-shake'" @animationend="shaking = false">
      <slot :described-by="describedBy" :invalid="!!error" />
    </div>
    <UiCollapse :open="!!error">
      <p
        v-if="shownError"
        :id="errorId"
        :role="error ? 'alert' : undefined"
        class="flex items-start gap-1.5 pt-2 text-sm font-medium text-danger motion-safe:animate-err-in motion-reduce:animate-fade-in"
      >
        <CircleAlert :size="16" aria-hidden="true" class="mt-0.5 shrink-0" />{{ shownError }}
      </p>
    </UiCollapse>
  </div>
</template>
