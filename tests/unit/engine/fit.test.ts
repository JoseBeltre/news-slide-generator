import { describe, expect, it } from 'vitest'
import { findLargestFittingSize } from '../../../src/slides/engine/fit'

const contar = (limite: number) => {
  let n = 0
  return { fits: (s: number) => (n++, s <= limite), calls: () => n }
}

describe('findLargestFittingSize', () => {
  it('encuentra el mayor tamaño que cabe', () => {
    expect(findLargestFittingSize({ min: 96, max: 150 }, (s) => s <= 117)).toBe(117)
  })

  it('todo cabe → max; solo cabe min → min; nada cabe → null', () => {
    expect(findLargestFittingSize({ min: 96, max: 150 }, () => true)).toBe(150)
    expect(findLargestFittingSize({ min: 96, max: 150 }, (s) => s === 96)).toBe(96)
    expect(findLargestFittingSize({ min: 96, max: 150 }, () => false)).toBeNull()
  })

  it('min === max', () => {
    expect(findLargestFittingSize({ min: 40, max: 40 }, () => true)).toBe(40)
    expect(findLargestFittingSize({ min: 40, max: 40 }, () => false)).toBeNull()
  })

  it.each([96, 97, 101, 123, 149, 150])('pocas mediciones (≤ 8 para 96–150), límite %i', (limite) => {
    const p = contar(limite)
    expect(findLargestFittingSize({ min: 96, max: 150 }, p.fits)).toBe(limite)
    expect(p.calls()).toBeLessThanOrEqual(8)
  })

  it('nunca sondea fuera del rango', () => {
    const vistos: number[] = []
    findLargestFittingSize({ min: 52, max: 64 }, (s) => (vistos.push(s), s <= 58))
    expect(vistos.every((s) => s >= 52 && s <= 64)).toBe(true)
  })

  it('rangos inválidos', () => {
    expect(() => findLargestFittingSize({ min: 150, max: 96 }, () => true)).toThrow(RangeError)
    expect(() => findLargestFittingSize({ min: 0, max: 96 }, () => true)).toThrow(RangeError)
    expect(() => findLargestFittingSize({ min: 96.5, max: 150 }, () => true)).toThrow(RangeError)
  })
})
