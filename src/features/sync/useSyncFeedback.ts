// Lo que el encabezado y los avisos necesitan saber de la sincronización: si acaba de terminar bien (el ✓
// pulsa una vez), si acaba de fallar (el ícono se sacude) y el aviso de error con "Reintentar".
import { computed, ref, watch, type ComputedRef } from 'vue'
import type { SyncService, SyncState } from '../../data/sync/service'
import { notify } from '../../ui/useSnackbar'

export const FEEDBACK_MS = 1200

export function useSyncFeedback(service: ComputedRef<SyncService | undefined>) {
  const state = computed<SyncState | undefined>(() => service.value?.state.value)
  const justSynced = ref(false)
  const justFailed = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  const flash = (flag: typeof justSynced) => {
    flag.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (flag.value = false), FEEDBACK_MS)
  }

  watch(
    () => state.value?.syncing,
    (now, before) => {
      if (before && !now && state.value?.status === 'sincronizado') flash(justSynced)
    },
  )
  watch(
    () => state.value?.status,
    (status, before) => {
      if (status !== 'nube-no-responde' || before === 'nube-no-responde') return
      flash(justFailed)
      notify({
        message: 'No se pudo sincronizar. Tus cambios están guardados en este equipo.',
        tone: 'error',
        action: { label: 'Reintentar', run: () => void service.value?.syncNow() },
      })
    },
  )

  return { state, justSynced, justFailed }
}
