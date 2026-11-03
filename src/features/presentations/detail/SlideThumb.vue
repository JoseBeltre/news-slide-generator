<script setup lang="ts">
// Una miniatura 16:9 (RF-54) con el mismo SlideView de la vista previa. Si no cabe se marca; si es de
// un anuncio, al tocarla se abre su editor.
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { SlideContext, SlideSpec, SlideStatus } from '../../../slides/templates/contract'
import SlideView from '../../../slides/templates/SlideView.vue'

const props = defineProps<{ spec: SlideSpec; ctx: SlideContext; announcementId?: string; number: number }>()
const emit = defineEmits<{ status: [status: SlideStatus['status']] }>()
const status = ref<SlideStatus['status']>('midiendo')

function onStatus(s: SlideStatus) {
  status.value = s.status
  emit('status', s.status)
}
</script>

<template>
  <figure data-thumb :data-status="status" class="flex flex-col gap-1">
    <component
      :is="announcementId ? RouterLink : 'div'"
      v-bind="announcementId ? { to: { name: 'editar', params: { id: announcementId } } } : {}"
      :class="[
        'block aspect-video overflow-hidden rounded-md border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        status === 'no_cabe' ? 'border-2 border-danger' : 'border-hairline',
      ]"
    >
      <SlideView :spec="spec" :ctx="ctx" @status="onStatus" />
    </component>
    <figcaption class="flex justify-between font-meta text-meta text-ink-muted">
      <span>{{ props.number }}</span>
      <span v-if="status === 'no_cabe'" class="text-danger uppercase">No cabe</span>
    </figcaption>
  </figure>
</template>
