<script setup lang="ts">
// "No cabe: Título" bajo la vista previa, con enlace a cada campo culpable (RF-10).
import { computed } from 'vue'
import type { SlideStatus } from '../../../../slides/templates/contract'
import type { AnnouncementTypeDef } from '../../../../slides/types/fields'
import UiBanner from '../../../../ui/UiBanner.vue'

const props = defineProps<{ status: SlideStatus; typeDef: AnnouncementTypeDef }>()

const fields = computed(() =>
  props.status.offendingFields.map((key) => ({ key, label: props.typeDef.fields.find((f) => f.key === key)?.label ?? key })),
)

function goTo(key: string) {
  const el = document.getElementById(`campo-${key}`)
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  el?.focus({ preventScroll: true })
}
</script>

<template>
  <div :data-fit-status="status.status">
    <UiBanner v-if="status.status === 'no_cabe'" tone="danger">
      <span class="font-medium">No cabe:</span>
      <template v-for="(f, i) in fields" :key="f.key">
        {{ i ? ', ' : ' ' }}<a :href="`#campo-${f.key}`" class="underline underline-offset-2" @click.prevent="goTo(f.key)">{{ f.label }}</a>
      </template>
      <span v-if="status.reason === 'density'"> (demasiados datos para una slide)</span>
    </UiBanner>
  </div>
</template>
