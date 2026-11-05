<script setup lang="ts">
// Añadir a alguien al equipo por su correo. Después esa persona entra con su correo y un código.
import { ref } from 'vue'
import UiButton from '../../../ui/UiButton.vue'
import UiField from '../../../ui/UiField.vue'
import UiInput from '../../../ui/UiInput.vue'

const props = defineProps<{ add: (email: string) => Promise<void> }>()
const email = ref('')
const error = ref<string>()

async function submit() {
  error.value = undefined
  try {
    await props.add(email.value)
    email.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}
</script>

<template>
  <form class="flex flex-col gap-3 md:flex-row md:items-start" novalidate @submit.prevent="submit">
    <div class="flex-1">
      <UiField id="equipo-correo" label="Añadir a alguien" :error="error" hint="Después entra con ese correo y un código.">
        <template #default="{ describedBy, invalid }">
          <UiInput id="equipo-correo" v-model="email" type="email" autocomplete="off" :aria-describedby="describedBy" :aria-invalid="invalid" />
        </template>
      </UiField>
    </div>
    <UiButton variant="primary" type="submit" class="md:mt-7">Añadir</UiButton>
  </form>
</template>
