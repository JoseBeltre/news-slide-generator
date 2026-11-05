<script setup lang="ts">
// Textos por defecto (RF-111): el título de la portada y el mensaje de cumpleaños. Se guardan al salir
// del campo o con Enter; vacío vuelve al valor por defecto y el campo lo muestra.
import { ref, watch } from 'vue'
import UiField from '../../ui/UiField.vue'
import UiInput from '../../ui/UiInput.vue'
import SettingsSection from './SettingsSection.vue'
import { useSettings } from './useSettings'

const { settings, save } = useSettings()
const cover = ref(settings.value.coverTitle)
const birthday = ref(settings.value.birthdayDefaultMessage)
watch(settings, (s) => {
  cover.value = s.coverTitle
  birthday.value = s.birthdayDefaultMessage
})

async function saveCover() {
  cover.value = (await save({ coverTitle: cover.value ?? '' })).coverTitle
}
async function saveBirthday() {
  birthday.value = (await save({ birthdayDefaultMessage: birthday.value ?? '' })).birthdayDefaultMessage
}
</script>

<template>
  <SettingsSection id="textos" title="Textos por defecto">
    <div class="flex max-w-xl flex-col gap-5">
      <UiField id="config-portada" label="Título de la portada">
        <UiInput id="config-portada" v-model="cover" @change="saveCover" />
      </UiField>
      <UiField id="config-cumpleanos" label="Mensaje de cumpleaños">
        <UiInput id="config-cumpleanos" v-model="birthday" @change="saveBirthday" />
      </UiField>
    </div>
  </SettingsSection>
</template>
