<script setup lang="ts">
// Lo único visible en la ventana pública antes del primer clic (RF-65): el navegador exige ese
// gesto para la pantalla completa. Desaparece con el clic.
defineEmits<{ go: [] }>()
</script>

<template>
  <button
    type="button"
    data-fullscreen-hint
    class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 font-sans text-2xl text-white"
    @click="$emit('go')"
  >
    Haz clic aquí para pantalla completa
  </button>
</template>
