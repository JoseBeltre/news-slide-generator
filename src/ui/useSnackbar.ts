// Snackbar global: una cola y un aviso a la vez. El normal se va solo a los 4 s; el de error y el de
// advertencia esperan a que se cierren (×) o se pulse su acción. Un único <UiSnackbar> en el marco de
// la app lo muestra; cualquier pantalla lo usa con `useSnackbar()`.
import { reactive, readonly } from 'vue'

export type SnackTone = 'normal' | 'error' | 'warning'

export interface SnackAction {
  label: string
  run: () => void | Promise<void>
}

export interface SnackInput {
  message: string
  tone?: SnackTone
  action?: SnackAction
  /** Un ✓ antes del texto: la acción salió bien (solo en el aviso normal). */
  success?: boolean
}

export interface SnackItem extends SnackInput {
  id: number
  tone: SnackTone
}

/** Lo que dura un aviso normal en pantalla (la barra fina se vacía en este tiempo). */
export const NORMAL_MS = 4000

const state = reactive<{ current: SnackItem | null; queue: SnackItem[] }>({ current: null, queue: [] })
let nextId = 1
let timer: ReturnType<typeof setTimeout> | undefined

/** Estado que lee <UiSnackbar>. */
export const snackbarState = readonly(state)

function showNext(): void {
  clearTimeout(timer)
  timer = undefined
  state.current = state.queue.shift() ?? null
  if (state.current?.tone === 'normal') timer = setTimeout(() => dismiss(state.current?.id), NORMAL_MS)
}

/** Pone un aviso en la cola (o lo muestra ya, si no hay otro). Devuelve su id. */
export function notify(input: SnackInput): number {
  const item: SnackItem = { ...input, tone: input.tone ?? 'normal', id: nextId++ }
  state.queue.push(item)
  if (!state.current) showNext()
  return item.id
}

/** Cierra el aviso `id` (o el actual si no se da) y pasa al siguiente. */
export function dismiss(id?: number): void {
  if (id !== undefined && state.current?.id !== id) {
    const at = state.queue.findIndex((s) => s.id === id)
    if (at >= 0) state.queue.splice(at, 1)
    return
  }
  if (state.current) showNext()
}

/** Ejecuta la acción del aviso actual (Deshacer, Reintentar…) y lo cierra. */
export async function runSnackAction(): Promise<void> {
  const current = state.current
  if (!current) return
  dismiss(current.id)
  await current.action?.run()
}

/** Para las pruebas. */
export function resetSnackbar(): void {
  clearTimeout(timer)
  timer = undefined
  state.current = null
  state.queue = []
}

export function useSnackbar() {
  return { notify, dismiss, runSnackAction }
}
