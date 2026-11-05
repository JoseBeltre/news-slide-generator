<script setup lang="ts">
// Zona que se abre y se cierra en altura con un fundido (campos que dependen de otra opción, mensajes de
// error). El contenido sigue montado pero cerrado queda `inert` (no se enfoca ni se lee). Es de los pocos
// casos donde se anima algo más que transform y opacity: la altura.
defineProps<{ open: boolean }>()
</script>

<template>
  <div
    :inert="!open"
    :aria-hidden="!open"
    :class="[
      'grid transition-[grid-template-rows,opacity] motion-reduce:duration-150',
      open ? 'grid-rows-[1fr] opacity-100 duration-220 ease-out' : 'grid-rows-[0fr] opacity-0 duration-200 ease-in',
    ]"
  >
    <div class="min-h-0 overflow-hidden">
      <!-- El margen negativo deja que el aro de foco de lo de dentro no se recorte. -->
      <div class="-m-1 p-1"><slot /></div>
    </div>
  </div>
</template>
