<script setup lang="ts">
// Equipo (§8.5): quién puede entrar. Cualquier editor añade o quita correos; cerrar sesión no borra
// nada de este equipo, pero avisa si quedan cambios sin subir.
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSync } from '../../../data/sync/useSync'
import UiButton from '../../../ui/UiButton.vue'
import UiField from '../../../ui/UiField.vue'
import UiInput from '../../../ui/UiInput.vue'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import { useConfirm } from '../../../ui/useConfirm'
import EditorRow from './EditorRow.vue'

const sync = useSync()
const router = useRouter()
const confirm = useConfirm()
const me = computed(() => sync.value?.auth.session.value?.email ?? null)
const editors = ref<string[]>([])
const email = ref('')
const error = ref<string>()
const loadError = ref<string>()

async function load() {
  if (!sync.value || !me.value) return
  try {
    editors.value = await sync.value.auth.listEditors()
    loadError.value = undefined
  } catch (e) {
    loadError.value = (e as Error).message
  }
}
onMounted(load)
watch(me, load)

async function add() {
  if (!sync.value) return
  error.value = undefined
  try {
    await sync.value.auth.addEditor(email.value)
    email.value = ''
    await load()
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function remove(target: string) {
  if (!sync.value) return
  if (!(await confirm({ title: `¿Quitar a ${target} del equipo? Ya no podrá sincronizar.`, confirmLabel: 'Quitar', danger: true }))) return
  try {
    await sync.value.auth.removeEditor(target)
    await load()
  } catch (e) {
    loadError.value = (e as Error).message
  }
}

async function signOut() {
  if (!sync.value) return
  const pending = sync.value.service.state.value.pending
  if (pending > 0) {
    const title = `Hay ${pending} cambios sin subir. Si cierras sesión se quedan en este equipo y se subirán cuando alguien vuelva a entrar aquí.`
    if (!(await confirm({ title, confirmLabel: 'Cerrar sesión' }))) return
  }
  await sync.value.auth.signOut()
  await router.push('/')
}
</script>

<template>
  <section class="mx-auto max-w-xl">
    <UiPageHeader title="Equipo">
      <UiButton v-if="me" @click="signOut">Cerrar sesión</UiButton>
    </UiPageHeader>
    <template v-if="me">
      <p class="pb-6 text-ink-muted">Estas personas pueden entrar con su correo y sincronizar los anuncios.</p>
      <p v-if="loadError" role="alert" class="pb-4 text-sm text-danger">{{ loadError }}</p>
      <ul class="pb-8">
        <EditorRow v-for="e in editors" :key="e" :email="e" :own="e === me" @remove="remove(e)" />
      </ul>
      <form class="flex flex-col gap-3 md:flex-row md:items-start" novalidate @submit.prevent="add">
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
    <div v-else-if="sync" class="flex flex-col items-start gap-4">
      <p class="text-ink-muted">Entra con tu correo para ver y gestionar el equipo.</p>
      <UiButton variant="primary" to="/entrar?volver=/equipo">Entrar</UiButton>
    </div>
  </section>
</template>
