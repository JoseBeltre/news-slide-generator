<script setup lang="ts">
// El botón principal "Nuevo anuncio" (atajo N, en el marco de la app). Con `icon`, en el celular solo el
// "+" (título de página) y con texto desde md; su nombre accesible sigue siendo "Nuevo anuncio".
import { Plus } from '@lucide/vue'
import UiButton from '../../../ui/UiButton.vue'

defineProps<{ icon?: boolean }>()
</script>

<template>
  <UiButton variant="primary" :to="{ name: 'nuevo' }" aria-keyshortcuts="N" :class="icon && 'max-md:size-11 max-md:px-0'">
    <Plus v-if="icon" :size="22" aria-hidden="true" class="md:hidden" />
    <span :class="icon && 'max-md:sr-only'">Nuevo anuncio</span>
  </UiButton>
</template>
