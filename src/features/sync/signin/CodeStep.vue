<script setup lang="ts">
// Paso 2 de Entrar: el código que llegó al correo. Se puede pedir otro o cambiar de correo.
import { ref } from 'vue'
import type { Auth } from '../../../data/sync/auth'
import { normalizeEmail } from '../../../data/sync/auth'
import UiButton from '../../../ui/UiButton.vue'
import UiField from '../../../ui/UiField.vue'
import UiInput from '../../../ui/UiInput.vue'

const props = defineProps<{ auth: Auth; email: string }>()
const emit = defineEmits<{ done: []; back: [] }>()

const code = ref('')
const error = ref<string>()
const notice = ref<string>()
const busy = ref(false)

async function verify() {
  busy.value = true
  error.value = undefined
  try {
    await props.auth.verifyCode(normalizeEmail(props.email), code.value)
    emit('done')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

async function resend() {
  error.value = undefined
  try {
    await props.auth.sendCode(props.email)
    notice.value = 'Te enviamos otro código.'
  } catch (e) {
    error.value = (e as Error).message
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="verify">
    <p class="text-sm text-ink">
      Escribe el código que enviamos a <strong class="font-medium">{{ normalizeEmail(email) }}</strong>. Si no lo ves, revisa la carpeta de spam.
    </p>
    <UiField id="entrar-codigo" label="Código" :error="error" :hint="notice">
      <template #default="{ describedBy, invalid }">
        <UiInput
          id="entrar-codigo"
          v-model="code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="8"
          :aria-describedby="describedBy"
          :aria-invalid="invalid"
        />
      </template>
    </UiField>
    <UiButton variant="primary" type="submit" :disabled="busy">{{ busy ? 'Comprobando…' : 'Entrar' }}</UiButton>
    <div class="flex flex-wrap gap-2">
      <UiButton variant="ghost" @click="resend">Enviar otro código</UiButton>
      <UiButton variant="ghost" @click="emit('back')">Cambiar correo</UiButton>
    </div>
  </form>
</template>
