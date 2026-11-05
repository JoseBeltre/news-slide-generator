<script setup lang="ts">
// Barra de navegación inferior (celular): Inicio, Anuncios, Presentar y Ajustes. Un fondo (óvalo) se desliza
// al destino actual y el ícono rebota apenas al llegar. Desde 768 px la navegación va en el encabezado.
import { Home, Megaphone, Presentation, Settings } from '@lucide/vue'
import { computed, ref, watch, type Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NAV_ITEMS, navIndexFor } from './navigation'

const ICONS: Record<string, Component> = { inicio: Home, anuncios: Megaphone, presentar: Presentation, ajustes: Settings }
const SLIDE = ['translate-x-0', 'translate-x-full', 'translate-x-[200%]', 'translate-x-[300%]']

const route = useRoute()
const current = computed(() => navIndexFor(route.name))
/** Último destino marcado: sin ninguno (Entrar…) el óvalo se desvanece donde estaba. */
const resting = ref(Math.max(0, current.value))
const bounce = ref(-1)
let timer: ReturnType<typeof setTimeout> | undefined

watch(current, (now) => {
  if (now < 0) return
  resting.value = now
  bounce.value = now
  clearTimeout(timer)
  timer = setTimeout(() => (bounce.value = -1), 400)
})
</script>

<template>
  <nav aria-label="Principal" class="fixed inset-x-0 bottom-0 z-40 grid h-nav grid-cols-4 border-t border-hairline bg-background md:hidden">
    <span aria-hidden="true" :class="['pointer-events-none absolute top-2 left-0 grid h-8 w-1/4 place-items-center transition-[transform,opacity] duration-260 ease-out-soft motion-reduce:transition-opacity', SLIDE[resting], current < 0 && 'opacity-0']">
      <span class="h-8 w-15 rounded-full bg-muted" />
    </span>
    <RouterLink
      v-for="(item, i) in NAV_ITEMS"
      :key="item.key"
      :to="item.to"
      :aria-current="i === current ? 'page' : undefined"
      :class="[
        'relative z-10 flex cursor-pointer flex-col items-center gap-1 pt-2 text-xs font-medium transition-[color,transform] duration-150 ease-out active:scale-97 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink',
        i === current ? 'text-ink' : 'text-ink-muted',
      ]"
    >
      <span class="grid h-8 place-items-center">
        <component :is="ICONS[item.key]" :size="22" aria-hidden="true" :class="bounce === i && 'motion-safe:animate-bounce-once'" />
      </span>
      {{ item.label }}
    </RouterLink>
  </nav>
</template>
