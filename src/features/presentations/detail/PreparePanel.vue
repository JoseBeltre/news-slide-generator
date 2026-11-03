<script setup lang="ts">
// "Preparar sin internet" (RF-55): el botón y el resultado de la comprobación.
import { CloudOff } from '@lucide/vue'
import type { OfflineReport } from '../../../data/offline'
import UiButton from '../../../ui/UiButton.vue'
import OfflineStatus from '../shared/OfflineStatus.vue'

defineProps<{ report?: OfflineReport; checking: boolean }>()
defineEmits<{ prepare: [] }>()
</script>

<template>
  <section aria-label="Sin internet" class="flex flex-col gap-3">
    <UiButton variant="primary" class="self-start" :disabled="checking" @click="$emit('prepare')">
      <CloudOff :size="18" aria-hidden="true" />Preparar sin internet
    </UiButton>
    <OfflineStatus :report="report" :checking="checking" />
  </section>
</template>
