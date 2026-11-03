<script setup lang="ts">
// Indicador "✓ Lista para usar sin internet" o la lista de lo que falta (RF-55). Los problemas de
// un anuncio enlazan a su editor.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { issueMessage, type OfflineReport } from '../../../data/offline'
import UiBanner from '../../../ui/UiBanner.vue'

const props = defineProps<{ report?: OfflineReport; checking: boolean; compact?: boolean }>()

/** Sin resultado, o solo faltan mediciones de slides: aún no se sabe si está lista. */
const measuring = computed(() => !props.report || (props.report.issues.length > 0 && props.report.issues.every((i) => i.kind === 'midiendo')))
const issues = computed(() =>
  (props.report?.issues ?? []).map((issue) => ({
    text: issueMessage(issue),
    id: 'announcementId' in issue ? issue.announcementId : undefined,
  })),
)
</script>

<template>
  <p v-if="measuring" class="text-sm text-ink-muted">Comprobando…</p>
  <UiBanner v-else-if="report?.ready" tone="success">
    ✓ Lista para usar sin internet
    <template v-if="!report?.persistent && !compact">
      <br />El navegador podría borrar los datos si se queda sin espacio.
    </template>
  </UiBanner>
  <UiBanner v-else tone="warning">
    Falta algo para usar sin internet
    <ul v-if="!compact" class="mt-1 list-disc pl-5">
      <li v-for="(issue, i) in issues" :key="i">
        <RouterLink v-if="issue.id" :to="{ name: 'editar', params: { id: issue.id } }" class="underline">{{ issue.text }}</RouterLink>
        <template v-else>{{ issue.text }}</template>
      </li>
    </ul>
  </UiBanner>
</template>
