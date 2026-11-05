// Carga de la página pública y su refresco: al abrir, al volver internet y al volver a la pestaña. Si
// llegan datos distintos a los que ya se veían, `pulse` se enciende un instante ("Actualizado hace…" pulsa
// una vez).
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { LoadState } from './types'

export const PULSE_MS = 700

const dataOf = (s: LoadState | null) => (s && 'data' in s ? JSON.stringify(s.data) : null)

export function useNotices(load: () => Promise<LoadState>) {
  const state = shallowRef<LoadState | null>(null)
  const pulse = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function refresh() {
    let next: LoadState
    try {
      next = await load()
    } catch {
      next = { kind: 'error' }
    }
    const before = dataOf(state.value)
    // Un fallo al refrescar no tira lo que ya se ve.
    if (state.value && (next.kind === 'error' || next.kind === 'offline') && before) return
    state.value = next
    const after = dataOf(next)
    if (before && after && before !== after) {
      pulse.value = true
      clearTimeout(timer)
      timer = setTimeout(() => (pulse.value = false), PULSE_MS)
    }
  }

  const onVisible = () => document.visibilityState === 'visible' && void refresh()
  onMounted(() => {
    void refresh()
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', onVisible)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', refresh)
    document.removeEventListener('visibilitychange', onVisible)
    clearTimeout(timer)
  })

  return { state, pulse, refresh }
}
