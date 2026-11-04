// Locks entre pestañas (§8.4): mientras se presenta, isPresenting() es verdadero; una sola pestaña
// sincroniza a la vez.
import { describe, expect, it } from 'vitest'
import { holdPresentingLock, isPresenting, withSyncLock } from '../../../../src/data/sync/locks'

describe('locks', () => {
  it('presentar se ve desde cualquier pestaña y se suelta al cerrar', async () => {
    expect(await isPresenting()).toBe(false)
    const release = holdPresentingLock()
    await new Promise((r) => setTimeout(r, 20))
    expect(await isPresenting()).toBe(true)
    release()
    await new Promise((r) => setTimeout(r, 20))
    expect(await isPresenting()).toBe(false)
  })

  it('si otra vuelta tiene el lock, la segunda no corre', async () => {
    let inner: unknown = 'sin correr'
    await withSyncLock(async () => {
      inner = await withSyncLock(async () => 'corrió')
    })
    expect(inner).toBeUndefined()
    expect(await withSyncLock(async () => 'ok')).toBe('ok')
  })
})
