<script setup lang="ts">
// Botón del encabezado que recorre el tema: del sistema → claro → oscuro.
import { Monitor, Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'
import UiIconButton from './UiIconButton.vue'
import { useTheme, type ThemeMode } from './useTheme'

const NEXT: Record<ThemeMode, ThemeMode> = { sistema: 'claro', claro: 'oscuro', oscuro: 'sistema' }
const NAME: Record<ThemeMode, string> = { sistema: 'del sistema', claro: 'claro', oscuro: 'oscuro' }
const ICON = { sistema: Monitor, claro: Sun, oscuro: Moon }

const { mode, set } = useTheme()
const label = computed(() => `Tema: ${NAME[mode.value]}. Cambiar a ${NAME[NEXT[mode.value]]}`)
</script>

<template>
  <UiIconButton :label="label" :icon="ICON[mode]" @click="set(NEXT[mode])" />
</template>
