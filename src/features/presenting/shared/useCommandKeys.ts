// Teclado y clicker (RF-64) en esta ventana: cada tecla conocida se vuelve un comando.
import { onBeforeUnmount } from 'vue'
import { commandForKey, type Command } from '../../../data/presenting'

const isField = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

export function useCommandKeys(onCommand: (command: Command) => void): void {
  const listener = (e: KeyboardEvent) => {
    const command = commandForKey(e, isField(e.target))
    if (!command) return
    e.preventDefault()
    onCommand(command)
  }
  window.addEventListener('keydown', listener)
  onBeforeUnmount(() => window.removeEventListener('keydown', listener))
}
