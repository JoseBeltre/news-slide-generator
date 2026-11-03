import { describe, expect, it } from 'vitest'
import { openPresentationChannel } from '../../../src/data/presentationChannel'

describe('canal real (BroadcastChannel)', () => {
  it('dos canales de la misma presentación se hablan en < 50 ms', async () => {
    const a = openPresentationChannel('real-1')
    const b = openPresentationChannel('real-1')
    const t0 = performance.now()
    const got = new Promise<number>((resolve) => b.onMessage((m) => m.type === 'goto' && resolve(performance.now() - t0)))
    a.send({ type: 'goto', index: 1 })
    expect(await got).toBeLessThan(50)
    a.close()
    b.close()
  })
})
