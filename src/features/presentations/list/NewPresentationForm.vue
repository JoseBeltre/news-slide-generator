<script setup lang="ts">
// Crear presentación (RF-50): la fecha (por defecto el próximo sábado) y "Crear presentación".
import { ref } from 'vue'
import { nextSaturday } from '../../../data/presentations'
import UiButton from '../../../ui/UiButton.vue'
import UiField from '../../../ui/UiField.vue'
import UiInput from '../../../ui/UiInput.vue'

const props = defineProps<{ today: string }>()
const emit = defineEmits<{ create: [date: string] }>()
const date = ref(nextSaturday(props.today))
</script>

<template>
  <form class="flex flex-wrap items-end gap-3 pb-8" @submit.prevent="date && emit('create', date)">
    <UiField id="fecha-presentacion" label="Fecha">
      <UiInput id="fecha-presentacion" v-model="date" type="date" required />
    </UiField>
    <UiButton variant="primary" type="submit" tall>Crear presentación</UiButton>
  </form>
</template>
