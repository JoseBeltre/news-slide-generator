<script setup lang="ts">
// "Guardar" del editor (Ctrl+S): spinner mientras guarda y ✓ al terminar. En el celular va a todo el ancho
// al final del formulario; desde 768 px, en el encabezado.
import UiButton from '../../../ui/UiButton.vue'
import type { BusyState } from '../../../ui/useBusy'

defineProps<{ busy: BusyState }>()
</script>

<template>
  <UiButton variant="primary" aria-keyshortcuts="Control+S" :busy="busy">Guardar</UiButton>
</template>
