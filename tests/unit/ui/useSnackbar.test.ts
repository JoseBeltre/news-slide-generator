// Snackbar global (UI móvil): una cola, uno a la vez. Normal se va solo a los 4 s; error y advertencia
// esperan a que se cierren o se pulse su acción.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NORMAL_MS, dismiss, notify, resetSnackbar, runSnackAction, snackbarState } from '../../../src/ui/useSnackbar'

beforeEach(() => {
  vi.useFakeTimers()
  resetSnackbar()
})
afterEach(() => {
  resetSnackbar()
  vi.useRealTimers()
})

describe('useSnackbar', () => {
  it('muestra el aviso y por defecto es normal', () => {
    notify({ message: 'Guardado' })
    expect(snackbarState.current).toMatchObject({ message: 'Guardado', tone: 'normal' })
  })

  it('el normal se cierra solo a los 4 s, no antes', () => {
    notify({ message: 'Guardado' })
    vi.advanceTimersByTime(NORMAL_MS - 1)
    expect(snackbarState.current).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(snackbarState.current).toBeNull()
  })

  it.each(['error', 'warning'] as const)('%s no se cierra solo, ni pasado mucho tiempo', (tone) => {
    notify({ message: 'Algo pasó', tone })
    vi.advanceTimersByTime(NORMAL_MS * 10)
    expect(snackbarState.current?.tone).toBe(tone)
  })

  it('uno a la vez: los demás esperan en la cola y salen en orden', () => {
    notify({ message: 'Uno' })
    notify({ message: 'Dos' })
    notify({ message: 'Tres' })
    expect(snackbarState.current?.message).toBe('Uno')
    expect(snackbarState.queue.map((s) => s.message)).toEqual(['Dos', 'Tres'])
    vi.advanceTimersByTime(NORMAL_MS)
    expect(snackbarState.current?.message).toBe('Dos')
    vi.advanceTimersByTime(NORMAL_MS)
    expect(snackbarState.current?.message).toBe('Tres')
    vi.advanceTimersByTime(NORMAL_MS)
    expect(snackbarState.current).toBeNull()
  })

  it('el siguiente normal cuenta sus 4 s desde que aparece', () => {
    notify({ message: 'Error', tone: 'error' })
    notify({ message: 'Hecho' })
    dismiss()
    expect(snackbarState.current?.message).toBe('Hecho')
    vi.advanceTimersByTime(NORMAL_MS - 1)
    expect(snackbarState.current?.message).toBe('Hecho')
    vi.advanceTimersByTime(1)
    expect(snackbarState.current).toBeNull()
  })

  it('cerrar (×) quita el aviso actual y pasa al siguiente', () => {
    notify({ message: 'Falló', tone: 'error' })
    notify({ message: 'Luego' })
    dismiss()
    expect(snackbarState.current?.message).toBe('Luego')
  })

  it('la acción se ejecuta una vez y cierra el aviso', async () => {
    const run = vi.fn()
    notify({ message: 'Eliminado', action: { label: 'Deshacer', run } })
    await runSnackAction()
    await runSnackAction()
    expect(run).toHaveBeenCalledTimes(1)
    expect(snackbarState.current).toBeNull()
  })

  it('una acción de error cierra el aviso aunque falle de nuevo (el fallo sale como un aviso nuevo)', async () => {
    notify({
      message: 'No se pudo',
      tone: 'error',
      action: { label: 'Reintentar', run: () => void notify({ message: 'Sigue sin poder', tone: 'error' }) },
    })
    await runSnackAction()
    expect(snackbarState.current?.message).toBe('Sigue sin poder')
  })

  it('sin aviso, runSnackAction y dismiss no hacen nada', async () => {
    await runSnackAction()
    dismiss()
    expect(snackbarState.current).toBeNull()
  })

  it('devuelve un id y dismiss(id) solo cierra ese aviso', () => {
    const a = notify({ message: 'A' })
    const b = notify({ message: 'B' })
    dismiss(b)
    expect(snackbarState.queue).toEqual([])
    expect(snackbarState.current?.id).toBe(a)
  })
})
