// Mientras el presentador o la ventana única están abiertos, la sincronización no aplica nada de lo
// que baja de la nube: la ventana pública no cambia a mitad de la reunión (§8.4).
import { onBeforeUnmount, onMounted } from 'vue'
import { holdPresentingLock } from '../../../data/sync/locks'

export function usePresentingLock(): void {
  let release = () => {}
  onMounted(() => void (release = holdPresentingLock()))
  onBeforeUnmount(() => release())
}
