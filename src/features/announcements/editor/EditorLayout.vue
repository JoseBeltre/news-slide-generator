<script setup lang="ts">
// Editor (SRS §6.3, DESIGN.md → Layout). Desde 1024 px: formulario ≈ 40 % a la izquierda y, a la
// derecha, vista previa + opciones fijas (con su propio desplazamiento). En el celular: vista previa
// arriba (plegable), luego el formulario y al final las opciones.
import { ChevronDown } from '@lucide/vue'
import { ref } from 'vue'

const previewOpen = ref(true)
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[2fr_3fr] lg:items-start lg:gap-8">
    <div class="contents lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col lg:gap-4 lg:overflow-y-auto">
      <section aria-label="Vista previa" class="order-1 flex flex-col gap-3">
        <button
          type="button"
          class="inline-flex h-11 cursor-pointer items-center gap-2 self-start text-sm font-medium text-ink-muted hover:text-ink lg:hidden"
          :aria-expanded="previewOpen"
          aria-controls="vista-previa"
          @click="previewOpen = !previewOpen"
        >
          <ChevronDown :size="18" aria-hidden="true" :class="['transition-transform', previewOpen ? '' : '-rotate-90']" />
          {{ previewOpen ? 'Ocultar vista previa' : 'Mostrar vista previa' }}
        </button>
        <div id="vista-previa" :class="['flex-col gap-3 lg:flex', previewOpen ? 'flex' : 'hidden']">
          <slot name="preview" />
        </div>
      </section>
      <section aria-label="Opciones de la slide" class="order-3">
        <slot name="options" />
      </section>
    </div>
    <section aria-label="Datos del anuncio" class="order-2 flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
      <slot name="form" />
    </section>
  </div>
</template>
