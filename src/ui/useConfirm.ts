// Confirmación de acciones destructivas (DESIGN.md: los modales son solo para eso). Un único
// <UiConfirm> montado en el marco de la app muestra la pregunta; `useConfirm` la hace.
import { reactive, readonly } from 'vue'

export interface ConfirmRequest {
  title: string
  confirmLabel: string
  danger?: boolean
}

const state = reactive<{ request: ConfirmRequest | null }>({ request: null })
let resolve: ((answer: boolean) => void) | undefined

/** Estado que lee <UiConfirm>. */
export const confirmState = readonly(state)

/** Responde la pregunta abierta (true = confirmar). */
export function answerConfirm(answer: boolean): void {
  resolve?.(answer)
  resolve = undefined
  state.request = null
}

/** Devuelve `ask`: abre el diálogo y resuelve true al confirmar, false con Cancelar o Esc. */
export function useConfirm() {
  return (request: ConfirmRequest) =>
    new Promise<boolean>((done) => {
      resolve?.(false) // una pregunta nueva cancela la anterior
      resolve = done
      state.request = { ...request }
    })
}
