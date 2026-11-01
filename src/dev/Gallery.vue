<script setup lang="ts">
// Galería de slides para revisar plantillas a ojo y para las capturas de regresión.
// ?only=<id> muestra una sola slide a 1920×1080; ?q=<texto> filtra por etiqueta.
import { computed, reactive } from 'vue'
import { auditSlide } from '../slides/engine'
import SlideView from '../slides/templates/SlideView.vue'
import type { SlideStatus } from '../slides/templates/contract'
import { galleryEntries } from './gallery-entries'

const params = new URLSearchParams(location.search)
const only = params.get('only')
const query = params.get('q') ?? ''

const entries = galleryEntries()
const shown = computed(() =>
  only ? entries.filter((e) => e.id === only) : entries.filter((e) => e.label.includes(query)),
)
const statuses = reactive<Record<string, SlideStatus>>({})

// Para las capturas y revisiones automáticas: violaciones de §5 de la slide mostrada.
;(window as unknown as { auditSlide: () => string[] }).auditSlide = () => {
  const canvas = document.querySelector<HTMLElement>('.slide-canvas')
  return canvas ? auditSlide(canvas).map((v) => `${v.code}: ${v.detail}`) : ['sin lienzo']
}
</script>

<template>
  <div v-if="only" class="single">
    <SlideView
      v-for="e in shown"
      :key="e.id"
      :spec="e.spec"
      :ctx="e.ctx"
      :data-status="statuses[e.id]?.status"
      @status="(s) => (statuses[e.id] = s)"
    />
  </div>
  <main v-else class="grid">
    <figure v-for="e in shown" :key="e.id">
      <div class="thumb">
        <SlideView :spec="e.spec" :ctx="e.ctx" @status="(s) => (statuses[e.id] = s)" />
      </div>
      <figcaption>
        <a :href="`?only=${e.id}`">{{ e.label }}</a>
        <strong :class="statuses[e.id]?.status">
          {{ statuses[e.id]?.status ?? '…' }}
          <template v-if="statuses[e.id]?.offendingFields.length"> ({{ statuses[e.id]!.offendingFields.join(', ') }})</template>
        </strong>
      </figcaption>
    </figure>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #e5e7eb;
}
.single {
  width: 1920px;
  height: 1080px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 24px;
  padding: 24px;
}
figure {
  margin: 0;
}
.thumb {
  aspect-ratio: 16 / 9;
  background: #000;
}
figcaption {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-top: 6px;
  font-size: 14px;
}
.no_cabe {
  color: #b91c1c;
}
.ok {
  color: #15803d;
}
</style>
