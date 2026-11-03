// El presentador manda (RF-60, RF-62, RF-64): aplica cada comando (botones, teclas, tira o la
// ventana pública), guarda el estado y lo envía. A un "hello" de la pública (abierta o reabierta)
// le responde con el estado, así vuelve a la misma slide (RF-67). Esc cierra la pública y sale.
import { computed, readonly, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { INITIAL_STATE, apply, type Command, type PresenterState } from '../../../data/presenting'
import { useCommandKeys } from '../shared/useCommandKeys'
import { usePresentationChannel } from '../shared/usePresentationChannel'
import { usePresentingData } from '../shared/usePresentingData'
import { usePublicWindow } from './usePublicWindow'

export function usePresenter(id: Ref<string>) {
  const router = useRouter()
  const data = usePresentingData(id)
  const state = ref<PresenterState>({ ...INITIAL_STATE })
  const channel = usePresentationChannel(id.value)
  const publicWindow = usePublicWindow(computed(() => `/publica/${id.value}`))

  const broadcast = () => channel.send({ type: 'state', state: { ...state.value } })

  function run(command: Command) {
    if (command.type === 'exit') {
      publicWindow.close()
      void router.push({ name: 'presentacion', params: { id: id.value } })
      return
    }
    state.value = apply(state.value, command, data.total.value)
    broadcast()
  }

  channel.onMessage((m) => {
    if (m.type === 'hello') broadcast()
    else if (m.type === 'command') run(m.command)
  })
  useCommandKeys(run)
  // Si la presentación cambia de tamaño (otra pestaña quitó un anuncio), el índice sigue siendo válido.
  watch(data.total, (total) => {
    if (state.value.index >= total) run({ type: 'goto', index: total - 1 })
  })

  return { ...data, state: readonly(state), run, publicWindow }
}
