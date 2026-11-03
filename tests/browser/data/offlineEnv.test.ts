import { describe, expect, it } from 'vitest'
import '../../../src/slides/fonts'
import { browserOfflineEnv } from '../../../src/data/offlineEnv'
import { DEFAULT_FONT_FAMILY } from '../../../src/slides/fonts'

describe('browserOfflineEnv', () => {
  const env = browserOfflineEnv()

  it('la letra de las slides empaquetada está lista', async () => {
    expect(await env.fontReady(DEFAULT_FONT_FAMILY)).toBe(true)
  })

  it('un logo en data: no necesita caché', async () => {
    expect(await env.assetCached('data:image/svg+xml,%3csvg%3e%3c/svg%3e')).toBe(true)
  })

  it('persist y Service Worker responden con un booleano, sin lanzar', async () => {
    expect(typeof (await env.requestPersist())).toBe('boolean')
    expect(await env.appInstalled()).toBe(false)
  })
})
