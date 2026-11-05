<script setup lang="ts">
// Encabezado de la app: nombre (lleva a Inicio), navegación principal y estado de la sincronización.
import { Settings } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import SyncIndicator from '../features/sync/SyncIndicator.vue'
import UiThemeToggle from '../ui/UiThemeToggle.vue'

const LINKS = [
  { to: { name: 'inicio' }, label: 'Inicio' },
  { to: { name: 'anuncios' }, label: 'Anuncios' },
  { to: { name: 'presentaciones' }, label: 'Presentaciones' },
  { to: { name: 'configuracion' }, label: 'Configuración', icon: Settings },
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
          <template v-if="'icon' in link">
            <component :is="link.icon" :size="18" aria-hidden="true" class="md:mr-1.5" /><span class="sr-only md:not-sr-only">{{ link.label }}</span>
          </template>
          <template v-else>{{ link.label }}</template>
        </RouterLink>
      </nav>
      <div class="ml-auto flex items-center gap-1 md:ml-0">
        <SyncIndicator />
        <UiThemeToggle />
      </div>
    </div>
  </header>
</template>
