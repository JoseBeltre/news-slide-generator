// Equipo (§8.5): leer, añadir y quitar correos, y cerrar sesión avisando de los cambios sin subir.
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSync } from '../../../data/sync/useSync'
import { useConfirm } from '../../../ui/useConfirm'

export function useTeam() {
  const sync = useSync()
  const router = useRouter()
  const confirm = useConfirm()
  const me = computed(() => sync.value?.auth.session.value?.email ?? null)
  const editors = ref<string[]>([])
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

  /** Lanza el mensaje para el formulario si no se pudo añadir. */
  async function add(email: string) {
    await sync.value?.auth.addEditor(email)
    await load()
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

  return { available: computed(() => sync.value !== null), me, editors, loadError, add, remove, signOut }
}
