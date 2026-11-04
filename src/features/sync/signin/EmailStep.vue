<script setup lang="ts">
// Paso 1 de Entrar: el correo. Antes de pedir el código comprueba que sea del equipo.
import { ref } from 'vue'
import type { Auth } from '../../../data/sync/auth'
import UiButton from '../../../ui/UiButton.vue'
import UiField from '../../../ui/UiField.vue'
import UiInput from '../../../ui/UiInput.vue'

const props = defineProps<{ auth: Auth }>()
const emit = defineEmits<{ sent: [email: string] }>()

const email = ref('')
const error = ref<string>()
const busy = ref(false)

async function send() {
  if (!email.value.trim()) return void (error.value = 'Escribe tu correo.')
  busy.value = true
  error.value = undefined
  try {
    if (!(await props.auth.canSignIn(email.value))) {
      error.value = 'Este correo no está en el equipo. Pídele a alguien del equipo que te añada.'
      return
    }
    await props.auth.sendCode(email.value)
    emit('sent', email.value)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="send">
    <UiField id="entrar-correo" label="Tu correo" :error="error" hint="Te enviaremos un código de 6 dígitos. No hace falta contraseña.">
      <template #default="{ describedBy, invalid }">
        <UiInput id="entrar-correo" v-model="email" type="email" autocomplete="email" :aria-describedby="describedBy" :aria-invalid="invalid" />
      </template>
    </UiField>
    <UiButton variant="primary" type="submit" :disabled="busy">{{ busy ? 'Enviando…' : 'Enviar código' }}</UiButton>
  </form>
</template>
