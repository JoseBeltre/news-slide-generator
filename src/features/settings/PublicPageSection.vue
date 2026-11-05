<script setup lang="ts">
// Página pública (spec P9 §6.3): quién ve los anuncios en /anuncios/publico. Con "Solo el equipo", el
// enlace de la congregación dice que no están disponibles y en Inicio no se ofrece compartirlo.
import type { Settings } from '../../data/models'
import UiChoiceGroup from '../../ui/UiChoiceGroup.vue'
import SettingsSection from './SettingsSection.vue'
import { useSettings } from './useSettings'

const { settings, save } = useSettings()
const AUDIENCE = [
  { value: 'todos', label: 'Para todos' },
  { value: 'equipo', label: 'Solo el equipo' },
]
</script>

<template>
  <SettingsSection id="pagina-publica" title="Página pública">
    <div class="flex max-w-xl flex-col gap-2">
      <p class="text-sm font-medium text-ink">Quién ve los anuncios</p>
      <UiChoiceGroup
        :model-value="settings.publicPage"
        :options="AUDIENCE"
        label="Quién ve los anuncios"
        @update:model-value="save({ publicPage: $event as Settings['publicPage'] })"
      />
      <p class="text-sm text-ink-muted">Con "Solo el equipo", el enlace de la congregación dice que los anuncios no están disponibles.</p>
    </div>
  </SettingsSection>
</template>
