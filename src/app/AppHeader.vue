<script setup lang="ts">
// Encabezado de la app: nombre (lleva a Inicio) y navegación principal.
import { RouterLink } from 'vue-router'
import UiThemeToggle from '../ui/UiThemeToggle.vue'

const LINKS = [
  { to: { name: 'inicio' }, label: 'Inicio' },
  { to: { name: 'anuncios' }, label: 'Anuncios' },
  { to: { name: 'presentaciones' }, label: 'Presentaciones' },
] as const

const linkClass =
  'inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-medium text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
</script>

<template>
  <header class="border-b border-hairline">
    <div class="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center gap-x-4 px-4 md:px-8">
      <RouterLink :to="{ name: 'inicio' }" class="inline-flex min-h-11 items-center font-display text-heading-sm whitespace-nowrap text-ink">Anuncios del Sábado</RouterLink>
      <nav aria-label="Principal" class="order-last -mx-3 flex w-full items-center gap-1 overflow-x-auto md:order-none md:mx-0 md:ml-auto md:w-auto">
        <RouterLink
          v-for="link in LINKS"
          :key="link.label"
          :to="link.to"
          :class="linkClass"
          exact-active-class="text-ink! underline underline-offset-4"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <UiThemeToggle class="ml-auto md:ml-0" />
    </div>
  </header>
</template>
