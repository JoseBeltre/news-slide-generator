<script setup lang="ts">
// Una persona del equipo. Nadie se quita a sí mismo: el equipo nunca queda vacío por accidente.
import UiButton from '../../../ui/UiButton.vue'

defineProps<{ email: string; own: boolean }>()
const emit = defineEmits<{ remove: [] }>()
</script>

<template>
  <li class="flex min-h-14 items-center justify-between gap-3 border-b border-hairline py-2">
    <span class="truncate text-ink">{{ email }}<span v-if="own" class="ml-2 font-meta text-meta text-ink-muted">(tú)</span></span>
    <UiButton variant="ghost" :disabled="own" :aria-label="`Quitar a ${email}`" @click="emit('remove')">Quitar</UiButton>
  </li>
</template>
