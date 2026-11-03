// Canal falso para las pruebas de presentar: guarda lo enviado y deja simular lo que llega de la otra ventana.
import type { ChannelMessage, PresentationChannel } from '../../../src/data/presentationChannel'
import { PRESENTATION_CHANNEL } from '../../../src/data/presentationChannel'

export function fakeChannel() {
  const sent: ChannelMessage[] = []
  const handlers = new Set<(m: ChannelMessage) => void>()
  let openedFor: string | undefined
  const channel: PresentationChannel = {
    send: (m) => void sent.push(m),
    onMessage: (h) => (handlers.add(h), () => void handlers.delete(h)),
    close: () => handlers.clear(),
  }
  return {
    sent,
    receive: (m: ChannelMessage) => handlers.forEach((h) => h(m)),
    openedFor: () => openedFor,
    provide: {
      [PRESENTATION_CHANNEL as symbol]: (id: string) => {
        openedFor = id
        return channel
      },
    },
  }
}
