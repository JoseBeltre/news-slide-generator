<script setup lang="ts">
// Almacenamiento (RF-102): cuánto ocupa la app en este equipo, si el navegador puede borrarla y, con
// sesión, cuánto de 1 GB usan las imágenes en la nube.
import { formatBytes } from '../../lib/bytes'
import UiButton from '../../ui/UiButton.vue'
import SettingsSection from './SettingsSection.vue'
import { CLOUD_QUOTA_BYTES, useStorageInfo } from './useStorageInfo'

const { local, persisted, protect, protectResult, cloud, signedIn } = useStorageInfo()
</script>

<template>
  <SettingsSection id="almacenamiento" title="Almacenamiento">
    <div class="flex max-w-xl flex-col items-start gap-4 text-ink">
      <p v-if="local">En este equipo: {{ formatBytes(local.used) }} usados</p>
      <p v-else class="text-ink-muted">Este navegador no informa el espacio usado</p>
      <p v-if="persisted">Los datos están protegidos</p>
      <template v-else-if="persisted === false">
        <p class="text-ink-muted">El navegador podría borrar los datos si le falta espacio.</p>
        <UiButton v-if="protectResult !== 'ok'" @click="protect">Proteger los datos</UiButton>
      </template>
      <p v-if="protectResult === 'ok'" role="status">Listo: el navegador no los borrará</p>
      <p v-else-if="protectResult === 'denegado'" role="status" class="text-ink-muted">
        El navegador no lo permitió. Instala la app o úsala más seguido.
      </p>
      <template v-if="signedIn">
        <p v-if="cloud === 'error'" class="text-ink-muted">En la nube: No se pudo consultar</p>
        <p v-else-if="cloud">En la nube: {{ formatBytes(cloud.used) }} de {{ formatBytes(CLOUD_QUOTA_BYTES) }}</p>
      </template>
    </div>
  </SettingsSection>
</template>
