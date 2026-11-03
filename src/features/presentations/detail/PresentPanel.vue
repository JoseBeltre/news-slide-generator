<script setup lang="ts">
// "Presentar" y "Una sola ventana" (RF-60, RF-66). Bloqueados si algo impide presentar (RF-10:
// incompleto, no cabe, eliminado o vacía); debajo, el primer motivo. Mientras se mide, no bloquea.
import { Presentation, ScreenShare } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { issueMessage } from '../../../data/offline'
import type { ContentIssue } from '../../../data/presentations'
import UiButton from '../../../ui/UiButton.vue'

const props = defineProps<{ presentationId: string; issues: ContentIssue[] }>()
const router = useRouter()
const blocking = computed(() => props.issues.filter((i) => i.kind !== 'midiendo'))
const go = (name: 'presentar' | 'una-ventana') => void router.push({ name, params: { id: props.presentationId } })
</script>

<template>
  <section aria-label="Presentar" class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-3">
      <UiButton variant="primary" :disabled="blocking.length > 0" @click="go('presentar')">
        <Presentation :size="18" aria-hidden="true" />Presentar
      </UiButton>
      <UiButton :disabled="blocking.length > 0" @click="go('una-ventana')">
        <ScreenShare :size="18" aria-hidden="true" />Una sola ventana
      </UiButton>
    </div>
    <p v-if="blocking.length" class="text-sm text-danger">{{ issueMessage(blocking[0]!) }}</p>
  </section>
</template>
