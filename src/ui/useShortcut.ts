// Atajos de teclado de la interfaz (DESIGN.md: N, Ctrl+S, 1–7, Esc). Se llama en el setup de un
// componente; el atajo vive mientras el componente esté montado.
import { onBeforeUnmount, onMounted } from 'vue'

export interface ShortcutOptions {
  /** Si el atajo también vale con el foco en un campo de texto (Ctrl+S sí; N no). */
  allowInFields?: boolean
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** `keys`: una tecla ('n', '6', 'escape') o 'mod+<tecla>' (Ctrl, o Cmd en Mac). */
export function matchesShortcut(keys: string, e: KeyboardEvent): boolean {
  const parts = keys.toLowerCase().split('+')
  const key = parts.at(-1)!
  const wantsMod = parts.includes('mod')
  const hasMod = e.ctrlKey || e.metaKey
  return e.key.toLowerCase() === key && wantsMod === hasMod && !e.altKey
}

export function useShortcut(keys: string, handler: (e: KeyboardEvent) => void, opts: ShortcutOptions = {}): void {
  const listener = (e: KeyboardEvent) => {
    if (!matchesShortcut(keys, e)) return
    if (!opts.allowInFields && isEditable(e.target)) return
    e.preventDefault()
    handler(e)
  }
  onMounted(() => window.addEventListener('keydown', listener))
  onBeforeUnmount(() => window.removeEventListener('keydown', listener))
}
