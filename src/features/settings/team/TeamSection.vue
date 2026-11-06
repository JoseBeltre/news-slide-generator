<script setup lang="ts">
// Equipo (§8.5): quién puede entrar. Solo el rol admin añade o quita correos; cerrar sesión no borra
// nada de este equipo, pero avisa si quedan cambios sin subir.
import UiButton from '../../../ui/UiButton.vue'
import SettingsSection from '../SettingsSection.vue'
import AddEditorForm from './AddEditorForm.vue'
import EditorRow from './EditorRow.vue'
import { useTeam } from './useTeam'

const { available, me, editors, admin, loadError, add, remove, signOut } = useTeam()
</script>

<template>
  <SettingsSection id="equipo" title="Equipo">
    <div class="max-w-xl">
      <template v-if="me">
        <p class="pb-6 text-ink-muted">Estas personas pueden entrar con su correo y sincronizar los anuncios.</p>
        <p v-if="loadError" role="alert" class="pb-4 text-sm text-danger">{{ loadError }}</p>
        <ul class="pb-8">
          <EditorRow v-for="e in editors" :key="e" :email="e" :own="e === me" :can-remove="admin" @remove="remove(e)" />
        </ul>
        <AddEditorForm v-if="admin" :add="add" />
        <p v-else class="text-sm text-ink-muted">Solo un administrador puede añadir o quitar personas.</p>
        <div class="pt-8">
          <UiButton @click="signOut">Cerrar sesión</UiButton>
        </div>
      </template>
      <div v-else-if="available" class="flex flex-col items-start gap-4">
        <p class="text-ink-muted">Entra con tu correo para ver y gestionar el equipo.</p>
        <UiButton variant="primary" to="/entrar?volver=/configuracion">Entrar</UiButton>
      </div>
    </div>
  </SettingsSection>
</template>
