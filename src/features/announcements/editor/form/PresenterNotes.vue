<script setup lang="ts">
// Notas del presentador (RF-06): lo que no cabe en la slide o se dice de viva voz. No se proyectan.
import UiField from '../../../../ui/UiField.vue'
import UiTextarea from '../../../../ui/UiTextarea.vue'

const notes = defineModel<string | undefined>()
</script>

<template>
  <UiField id="campo-notas" label="Notas del presentador" hint="No se proyectan.">
    <template #default="{ describedBy }">
      <UiTextarea id="campo-notas" v-model="notes" rows="4" :aria-describedby="describedBy" />
    </template>
  </UiField>
</template>
