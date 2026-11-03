// Canal entre la vista del presentador y la ventana pública (RF-60, §8.3): BroadcastChannel local,
// sin red. Cada mensaje lleva la presentación; los de otra, o mal formados, se descartan.
import type { InjectionKey } from 'vue'
import type { Command, PresenterState } from './presenting'

export type ChannelMessage =
  | { type: 'state'; state: PresenterState }
  | { type: 'goto'; index: number }
  | { type: 'black'; on: boolean }
  | { type: 'logo'; on: boolean }
  | { type: 'hello' }
  | { type: 'command'; command: Command }

export interface PresentationChannel {
  send(message: ChannelMessage): void
  /** Devuelve la función para dejar de escuchar. */
  onMessage(handler: (message: ChannelMessage) => void): () => void
  close(): void
}

type ChannelLike = Pick<BroadcastChannel, 'postMessage' | 'close' | 'addEventListener' | 'removeEventListener'>

export const CHANNEL_NAME = 'presentacion'

/** Para las pruebas: otra forma de abrir el canal (provide). */
export const PRESENTATION_CHANNEL: InjectionKey<(presentationId: string) => PresentationChannel> = Symbol('PresentationChannel')

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function isState(v: unknown): v is PresenterState {
  return isObject(v) && typeof v.index === 'number' && typeof v.black === 'boolean' && typeof v.logo === 'boolean'
}

/** El mensaje sin `presentationId`, o undefined si no es uno nuestro. */
function parse(data: Record<string, unknown>): ChannelMessage | undefined {
  switch (data.type) {
    case 'state':
      return isState(data.state) ? { type: 'state', state: data.state } : undefined
    case 'goto':
      return typeof data.index === 'number' ? { type: 'goto', index: data.index } : undefined
    case 'black':
    case 'logo':
      return typeof data.on === 'boolean' ? { type: data.type, on: data.on } : undefined
    case 'hello':
      return { type: 'hello' }
    case 'command':
      return isObject(data.command) && typeof data.command.type === 'string' ? { type: 'command', command: data.command as Command } : undefined
    default:
      return undefined
  }
}

export function openPresentationChannel(
  presentationId: string,
  create: (name: string) => ChannelLike = (name) => new BroadcastChannel(name),
): PresentationChannel {
  const channel = create(CHANNEL_NAME)
  const stops = new Set<() => void>()
  return {
    send: (message) => channel.postMessage({ presentationId, ...message }),
    onMessage(handler) {
      const listener = (e: Event) => {
        const data = (e as MessageEvent).data
        if (!isObject(data) || data.presentationId !== presentationId) return
        const message = parse(data)
        if (message) handler(message)
      }
      channel.addEventListener('message', listener)
      const stop = () => {
        channel.removeEventListener('message', listener)
        stops.delete(stop)
      }
      stops.add(stop)
      return stop
    },
    close() {
      stops.forEach((stop) => stop())
      channel.close()
    },
  }
}
