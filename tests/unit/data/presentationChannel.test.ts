import { describe, expect, it } from 'vitest'
import { openPresentationChannel, type ChannelMessage } from '../../../src/data/presentationChannel'

/** BroadcastChannel en memoria: lo que uno envía lo reciben los demás con el mismo nombre. */
function memoryBus() {
  type Listener = (e: MessageEvent) => void
  const peers = new Map<string, Set<{ listeners: Set<Listener> }>>()
  return (name: string) => {
    const self = { listeners: new Set<Listener>() }
    const group = peers.get(name) ?? new Set()
    peers.set(name, group.add(self))
    return {
      postMessage: (data: unknown) => group.forEach((p) => p !== self && p.listeners.forEach((l) => l(new MessageEvent('message', { data })))),
      close: () => void group.delete(self),
      addEventListener: (_: string, l: Listener) => void self.listeners.add(l),
      removeEventListener: (_: string, l: Listener) => void self.listeners.delete(l),
    } as unknown as BroadcastChannel
  }
}

describe('openPresentationChannel (RF-60)', () => {
  it('lo enviado llega al otro extremo sin presentationId', () => {
    const bus = memoryBus()
    const a = openPresentationChannel('p1', bus)
    const b = openPresentationChannel('p1', bus)
    const got: ChannelMessage[] = []
    b.onMessage((m) => got.push(m))
    a.send({ type: 'goto', index: 2 })
    a.send({ type: 'command', command: { type: 'next' } })
    expect(got).toEqual([{ type: 'goto', index: 2 }, { type: 'command', command: { type: 'next' } }])
  })

  it('otra presentación, mensajes mal formados o tras cerrar → nada', () => {
    const bus = memoryBus()
    const raw = bus('presentacion')
    const b = openPresentationChannel('p1', bus)
    const got: ChannelMessage[] = []
    const stop = b.onMessage((m) => got.push(m))
    openPresentationChannel('p2', bus).send({ type: 'hello' })
    raw.postMessage({})
    raw.postMessage({ presentationId: 'p1', type: 'nada' })
    raw.postMessage({ presentationId: 'p1', type: 'goto', index: 'x' })
    raw.postMessage('hola')
    expect(got).toEqual([])
    raw.postMessage({ presentationId: 'p1', type: 'hello' })
    expect(got).toEqual([{ type: 'hello' }])
    stop()
    raw.postMessage({ presentationId: 'p1', type: 'hello' })
    expect(got).toHaveLength(1)
    b.close()
  })
})
