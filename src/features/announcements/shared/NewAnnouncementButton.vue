<script setup lang="ts">
// El botón principal "Nuevo anuncio" (atajo N, en el marco de la app). Con `icon`, solo el "+" (título
// de página en el celular); su nombre accesible sigue siendo "Nuevo anuncio".
import { Plus } from '@lucide/vue'
import UiButton from '../../../ui/UiButton.vue'
import UiIconButton from '../../../ui/UiIconButton.vue'

defineProps<{ icon?: boolean }>()
</script>

<template>
  <UiIconButton v-if="icon" label="Nuevo anuncio" :icon="Plus" :size="22" variant="solid" :to="{ name: 'nuevo' }" aria-keyshortcuts="N" />
  <UiButton v-else variant="primary" :to="{ name: 'nuevo' }" aria-keyshortcuts="N">Nuevo anuncio</UiButton>
</template>
