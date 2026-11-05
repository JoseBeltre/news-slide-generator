<script setup lang="ts">
// Fila de arriba del editor en el celular: «‹ Anuncios» para volver a la lista y, a la derecha, el estado
// del anuncio (Borrador / No cabe).
import { ChevronLeft } from '@lucide/vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="-mt-1.5 -ml-2 mb-2 flex items-center gap-1">
    <RouterLink
      :to="{ name: 'anuncios' }"
      class="inline-flex h-11 cursor-pointer items-center gap-1 rounded-sm px-2 text-[15px] font-medium text-ink underline-offset-4 transition-transform duration-150 ease-out hover:underline active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <ChevronLeft :size="20" aria-hidden="true" />Anuncios
    </RouterLink>
    <span class="ml-auto"><slot /></span>
  </div>
</template>
