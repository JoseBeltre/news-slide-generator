// Vista previa del editor: se atenúa un instante al cambiar de estilo, plantilla o tema (no con cada letra).
import { effectScope, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FADE_MS, useFadeOnChange } from '../../../src/features/announcements/editor/preview/useFadeOnChange'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useFadeOnChange', () => {
  it('no se atenúa al montar; sí al cambiar la clave, y vuelve sola', async () => {
    const key = ref('himnario')
    const dim = effectScope().run(() => useFadeOnChange(() => key.value))!
    expect(dim.value).toBe(false)
    key.value = 'cartel'
    await nextTick()
    expect(dim.value).toBe(true)
    vi.advanceTimersByTime(FADE_MS)
    expect(dim.value).toBe(false)
  })

  it('una clave igual no la atenúa', async () => {
    const key = ref('a')
    const dim = effectScope().run(() => useFadeOnChange(() => key.value))!
    key.value = 'a'
    await nextTick()
    expect(dim.value).toBe(false)
  })
})
