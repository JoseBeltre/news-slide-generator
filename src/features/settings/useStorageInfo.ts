// Espacio usado (RF-102): en este equipo (navigator.storage) y, con sesión, en la nube. Todo es
// opcional: un navegador sin la API deja los valores en null y la sección lo dice.
import { computed, onMounted, ref, watch } from 'vue'
import { useSync } from '../../data/sync/useSync'

/** Plan gratuito de Supabase: 1 GB de archivos. */
export const CLOUD_QUOTA_BYTES = 1024 ** 3

export function useStorageInfo() {
  const sync = useSync()
  const local = ref<{ used: number } | null>(null)
  const persisted = ref<boolean | null>(null)
  const protectResult = ref<'ok' | 'denegado' | null>(null)
  const cloud = ref<{ used: number } | 'error' | null>(null)
  const signedIn = computed(() => !!sync.value?.auth.session.value)

  async function loadLocal() {
    const storage = typeof navigator === 'undefined' ? undefined : navigator.storage
    const estimate = await storage?.estimate?.().catch(() => undefined)
    local.value = estimate?.usage === undefined ? null : { used: estimate.usage }
    persisted.value = (await storage?.persisted?.().catch(() => null)) ?? null
  }

  async function loadCloud() {
    if (!sync.value || !signedIn.value) return void (cloud.value = null)
    try {
      cloud.value = { used: await sync.value.remote.usedBytes() }
    } catch {
      cloud.value = 'error'
    }
  }

  async function protect() {
    const ok = (await navigator.storage?.persist?.().catch(() => false)) ?? false
    protectResult.value = ok ? 'ok' : 'denegado'
    if (ok) persisted.value = true
  }

  onMounted(() => void Promise.all([loadLocal(), loadCloud()]))
  watch(signedIn, loadCloud)
  return { local, persisted, protect, protectResult, cloud, signedIn }
}
