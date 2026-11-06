// Movimiento de la lista de anuncios: filas escalonadas (30 ms) solo la primera vez que se carga la
// lista en la sesión, y resaltado de lo que aparece nuevo (recién guardado o llegado de otro lado).
import { effectScope, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HIGHLIGHT_MS, STAGGER_MS, markNewAnnouncement, resetRowMotion, takeNewAnnouncement, useRowMotion } from '../../../src/features/announcements/shared/useRowMotion'

beforeEach(() => {
  vi.useFakeTimers()
  resetRowMotion()
})

function setup(initial: string[], loaded = true) {
  const ids = ref(initial)
  const isLoaded = ref(loaded)
  const scope = effectScope()
  const motion = scope.run(() => useRowMotion(() => ids.value, () => isLoaded.value))!
  return { ids, isLoaded, motion, scope }
}

describe('useRowMotion', () => {
  it('la primera vez que se carga la lista escalona 30 ms por fila', async () => {
    const { motion } = setup(['a', 'b', 'c'])
    await nextTick()
    expect(motion.stagger).toBe(true)
    expect(motion.delayOf(0)).toBe('0ms')
    expect(motion.delayOf(2)).toBe(`${2 * STAGGER_MS}ms`)
  })

  it('las siguientes veces en la sesión ya no escalona', async () => {
    setup(['a']).scope.stop()
    const second = setup(['a', 'b'])
    expect(second.motion.stagger).toBe(false)
    expect(second.motion.delayOf(1)).toBeUndefined()
  })

  it('lo que llega después de la carga se resalta ~1 s y no lo ya conocido', async () => {
    const { ids, motion } = setup(['a', 'b'])
    await nextTick()
    expect(motion.highlighted.value.size).toBe(0)
    ids.value = ['c', 'a', 'b']
    await nextTick()
    expect([...motion.highlighted.value]).toEqual(['c'])
    vi.advanceTimersByTime(HIGHLIGHT_MS)
    expect(motion.highlighted.value.size).toBe(0)
  })

  it('un anuncio recién guardado en el editor se resalta al abrir la lista', async () => {
    markNewAnnouncement('nuevo')
    const { motion } = setup(['viejo', 'nuevo'])
    await nextTick()
    expect([...motion.highlighted.value]).toEqual(['nuevo'])
    expect(takeNewAnnouncement()).toBeUndefined()
  })

  it('mientras no haya cargado no cuenta nada como nuevo', async () => {
    const { ids, isLoaded, motion } = setup([], false)
    ids.value = ['a']
    await nextTick()
    expect(motion.highlighted.value.size).toBe(0)
    isLoaded.value = true
    await nextTick()
    expect(motion.highlighted.value.size).toBe(0)
  })

  it('con la lista ya montada, el movimiento de entrada queda activo para lo nuevo', async () => {
    const { ids, motion } = setup(['a'])
    await nextTick()
    expect(motion.settled.value).toBe(true)
    ids.value = ['b', 'a']
    await nextTick()
    expect(motion.settled.value).toBe(true)
  })
})
