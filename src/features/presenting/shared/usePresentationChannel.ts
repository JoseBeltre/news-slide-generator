// Abre el canal de la presentación (o el de las pruebas, por provide) y lo cierra al salir.
import { inject, onBeforeUnmount } from 'vue'
import { PRESENTATION_CHANNEL, openPresentationChannel } from '../../../data/presentationChannel'

export function usePresentationChannel(presentationId: string) {
  const open = inject(PRESENTATION_CHANNEL, undefined) ?? ((id: string) => openPresentationChannel(id))
  const channel = open(presentationId)
  onBeforeUnmount(() => channel.close())
  return channel
}
