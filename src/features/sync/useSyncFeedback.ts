// Lo que el encabezado y los avisos necesitan saber de la sincronización: si acaba de terminar bien (el ✓
// pulsa una vez), si acaba de fallar (el ícono se sacude) y el aviso de error con "Reintentar".
import { computed, ref, watch, type ComputedRef } from 'vue'
import type { SyncService, SyncState } from '../../data/sync/service'
import { dismiss, notify } from '../../ui/useSnackbar'

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
  // Un aviso por intento fallido (también si Reintentar falla con el mismo estado); el anterior se reemplaza.
  let noticeId: number | undefined
  watch(
    () => state.value?.errorTick,
    (tick, before) => {
      if (!tick || tick === before || state.value?.status !== 'nube-no-responde') return
      if (noticeId !== undefined) dismiss(noticeId)
      flash(justFailed)
      noticeId = notify({
        message: 'No se pudo sincronizar. Tus cambios están guardados en este equipo.',
        tone: 'error',
        action: { label: 'Reintentar', run: () => void service.value?.syncNow() },
      })
    },
  )
  // Al recuperarse, el aviso de error ya no tiene sentido.
  watch(
    () => state.value?.status,
    (status) => {
      if (status !== 'nube-no-responde' && noticeId !== undefined) {
        dismiss(noticeId)
        noticeId = undefined
      }
    },
  )

  return { state, justSynced, justFailed }
}
