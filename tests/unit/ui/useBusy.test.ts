// Estado de un botón que trabaja: cargando (spinner, deshabilitado) → hecho (✓ breve) → reposo.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DONE_MS, useBusy } from '../../../src/ui/useBusy'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useBusy', () => {
  it('pasa de reposo a cargando, a hecho y de vuelta a reposo', async () => {
    const { state, run } = useBusy()
    let finish!: () => void
    const p = run(() => new Promise<void>((r) => (finish = r)))
    expect(state.value).toBe('loading')
    finish()
    await p
    expect(state.value).toBe('done')
    vi.advanceTimersByTime(DONE_MS)
    expect(state.value).toBe('idle')
  })

  it('mientras trabaja ignora otra pulsación', async () => {
    const { run } = useBusy()
    const fn = vi.fn(() => Promise.resolve())
    const first = run(fn)
    expect(await run(fn)).toBeUndefined()
    await first
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('si falla vuelve a reposo sin ✓ y deja pasar el error', async () => {
    const { state, run } = useBusy()
    await expect(run(() => Promise.reject(new Error('x')))).rejects.toThrow('x')
    expect(state.value).toBe('idle')
  })

  it('si la función devuelve false (no salió bien) tampoco muestra ✓', async () => {
    const { state, run } = useBusy()
    await run(async () => false)
    expect(state.value).toBe('idle')
  })

  it('devuelve lo que devuelve la función', async () => {
    const { run } = useBusy()
    expect(await run(async () => 42)).toBe(42)
  })
})
