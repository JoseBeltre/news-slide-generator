<script setup lang="ts">
// Filas de relleno mientras se leen los anuncios (forma de AnnouncementRow, con brillo).
import UiSkeleton from '../../../ui/UiSkeleton.vue'
</script>

<template>
  <div role="status" aria-label="Cargando los anuncios" aria-busy="true" class="border-t border-hairline">
    <div v-for="n in 5" :key="n" class="flex items-center gap-3 border-b border-hairline py-3">
      <UiSkeleton class="size-10 shrink-0 rounded-md" />
      <div class="flex flex-1 flex-col gap-2">
        <UiSkeleton class="h-4 w-[70%] rounded-sm" />
        <UiSkeleton class="h-3 w-[38%] rounded-sm" />
      </div>
    </div>
  </div>
</template>
