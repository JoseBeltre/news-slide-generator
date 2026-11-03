<script setup lang="ts">
// Controles del presentador (RF-62, RF-65): anterior, siguiente, negro, logo, "3 de 9", la hora y
// la pantalla pública (abrir o reabrir, con las instrucciones).
import { ChevronLeft, ChevronRight, MonitorUp } from '@lucide/vue'
import type { Command, PresenterState } from '../../../data/presenting'
import UiButton from '../../../ui/UiButton.vue'
import { useClock } from './useClock'

defineProps<{ state: PresenterState; total: number; publicOpen: boolean; opened: boolean }>()
defineEmits<{ command: [command: Command]; openPublic: [] }>()
const time = useClock()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <UiButton aria-label="Anterior" @click="$emit('command', { type: 'prev' })"><ChevronLeft :size="20" aria-hidden="true" />Anterior</UiButton>
    <UiButton variant="primary" aria-label="Siguiente" @click="$emit('command', { type: 'next' })">
      Siguiente<ChevronRight :size="20" aria-hidden="true" />
    </UiButton>
    <UiButton :aria-pressed="state.black" aria-label="Negro (B)" @click="$emit('command', { type: 'black' })">Negro (B)</UiButton>
    <UiButton :aria-pressed="state.logo" aria-label="Logo (L)" @click="$emit('command', { type: 'logo' })">Logo (L)</UiButton>
    <span class="font-meta text-meta uppercase text-ink-muted">{{ total ? state.index + 1 : 0 }} de {{ total }}</span>
    <span class="font-meta text-meta text-ink-muted">{{ time }}</span>
    <div class="ml-auto flex flex-wrap items-center gap-3">
      <span v-if="!publicOpen" class="max-w-xs text-sm text-ink-muted">Mueve la ventana a las pantallas y haz clic en ella para pantalla completa.</span>
      <UiButton v-if="!publicOpen" :aria-label="opened ? 'Reabrir pantalla pública' : 'Abrir pantalla pública'" @click="$emit('openPublic')">
        <MonitorUp :size="18" aria-hidden="true" />{{ opened ? 'Reabrir pantalla pública' : 'Abrir pantalla pública' }}
      </UiButton>
      <span v-else class="text-sm text-success">Pantalla pública abierta</span>
    </div>
  </div>
</template>
