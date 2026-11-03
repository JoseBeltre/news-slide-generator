// El presentador manda (RF-60, RF-62, RF-64): aplica cada comando (botones, teclas, tira o la
// ventana pública), guarda el estado y lo envía. A un "hello" de la pública (abierta o reabierta)
// le responde con el estado, así vuelve a la misma slide (RF-67). Esc cierra la pública y sale.
// El estado se guarda en la pestaña: si se recarga el presentador, vuelve a su slide y se la envía a
// la pública. Si otro presentador de la misma presentación cambia el estado, este lo adopta.
import { computed, readonly, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { INITIAL_STATE, apply, type Command, type PresenterState } from '../../../data/presenting'
import { useCommandKeys } from '../shared/useCommandKeys'
import { usePresentationChannel } from '../shared/usePresentationChannel'
import { usePresentingData } from '../shared/usePresentingData'
import { usePublicWindow } from './usePublicWindow'

function restore(key: string): PresenterState {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null') as Partial<PresenterState> | null
    if (saved && Number.isInteger(saved.index) && typeof saved.black === 'boolean' && typeof saved.logo === 'boolean')
      return saved as PresenterState
  } catch {
    // Valor dañado o sin almacenamiento: desde el principio.
  }
  return { ...INITIAL_STATE }
}

export function usePresenter(id: Ref<string>) {
  const router = useRouter()
  const data = usePresentingData(id)
  const storageKey = `presentar:${id.value}`
  const state = ref<PresenterState>(restore(storageKey))
  const channel = usePresentationChannel(id.value)
  const publicWindow = usePublicWindow(computed(() => `/publica/${id.value}`))

  const broadcast = () => channel.send({ type: 'state', state: { ...state.value } })
  const remember = (next: PresenterState) => {
    state.value = next
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Sin almacenamiento: al recargar se empieza de nuevo.
    }
  }

  function run(command: Command) {
    if (command.type === 'exit') {
      publicWindow.close()
      void router.push({ name: 'presentacion', params: { id: id.value } })
      return
    }
    remember(apply(state.value, command, data.total.value))
    broadcast()
  }

  channel.onMessage((m) => {
    if (m.type === 'hello') broadcast()
    else if (m.type === 'command') run(m.command)
    else if (m.type === 'state') remember(m.state)
  })
  broadcast()
  useCommandKeys(run)
  // Si la presentación se achica (otra pestaña quitó un anuncio), el índice sigue siendo válido; sin
  // tocar negro ni logo. Solo cuando baja: al cargar, el total sube por pasos (portada y cierre
  // primero) y recortar ahí perdería la slide guardada.
  watch(data.total, (total, before) => {
    if (total === 0 || total >= before || state.value.index < total) return
    remember({ ...state.value, index: total - 1 })
    broadcast()
  })

  return { ...data, state: readonly(state), run, publicWindow }
}
