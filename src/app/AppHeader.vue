<script setup lang="ts">
// Encabezado de la app: nombre (lleva a Inicio) y navegación principal.
import { RouterLink } from 'vue-router'

const LINKS = [
  { to: { name: 'inicio' }, label: 'Inicio' },
  { to: { name: 'anuncios' }, label: 'Anuncios' },
] as const

const linkClass =
  'rounded-sm px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
</script>

<template>
  <header class="border-b border-hairline">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
      <RouterLink :to="{ name: 'inicio' }" class="font-display text-heading-sm text-ink">Anuncios del Sábado</RouterLink>
      <nav aria-label="Principal" class="flex gap-1">
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
    </div>
  </header>
</template>
