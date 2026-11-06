// Estado de un botón que trabaja (guardar, sincronizar, importar): spinner dentro del botón mientras
// corre, ✓ breve al terminar bien y vuelta al reposo. Mientras no esté en reposo ignora otra pulsación.
import { getCurrentInstance, onBeforeUnmount, ref } from 'vue'

export type BusyState = 'idle' | 'loading' | 'done'

/** Cuánto se queda el ✓ antes de volver al texto del botón. */
export const DONE_MS = 1000

export function useBusy() {
  const state = ref<BusyState>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Corre `fn`. Si devuelve `false` se toma como fallo (sin ✓). Con la pulsación repetida devuelve undefined. */
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (state.value !== 'idle') return undefined
    state.value = 'loading'
    try {
      const result = await fn()
      if (result === false) {
        state.value = 'idle'
        return result
      }
      state.value = 'done'
      timer = setTimeout(() => (state.value = 'idle'), DONE_MS)
      return result
    } catch (e) {
      state.value = 'idle'
      throw e
    }
  }

  // Dentro de un componente, no deja un temporizador vivo al desmontarse.
  if (getCurrentInstance()) onBeforeUnmount(() => clearTimeout(timer))

  return { state, run }
}
