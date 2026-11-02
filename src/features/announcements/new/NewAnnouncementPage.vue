<script setup lang="ts">
// Paso 1 (RF-01): elegir el tipo. Las teclas 1–7 eligen directo.
import { useRouter } from 'vue-router'
import { ANNOUNCEMENT_TYPES } from '../../../slides/types/definitions'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import { useShortcut } from '../../../ui/useShortcut'
import TypeCard from './TypeCard.vue'

const router = useRouter()
ANNOUNCEMENT_TYPES.forEach((t, i) =>
  useShortcut(String(i + 1), () => void router.push({ name: 'nuevo-tipo', params: { typeId: t.id } })),
)
</script>

<template>
  <UiPageHeader title="Nuevo anuncio" />
  <p class="-mt-4 pb-6 text-ink-muted">¿Qué vas a anunciar?</p>
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <TypeCard v-for="(t, i) in ANNOUNCEMENT_TYPES" :key="t.id" :type-id="t.id" :shortcut="i + 1" />
  </div>
</template>
