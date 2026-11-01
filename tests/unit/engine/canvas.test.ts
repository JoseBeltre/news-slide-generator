import { describe, expect, it } from 'vitest'
import { CANVAS, SAFE_AREA, computeScale, isInsideSafeArea } from '../../../src/slides/engine/canvas'

describe('computeScale', () => {
  it.each([
    [960, 540, { scale: 0.5, offsetX: 0, offsetY: 0 }],
    [1920, 1200, { scale: 1, offsetX: 0, offsetY: 60 }],
    [1000, 1000, { scale: 1000 / 1920, offsetX: 0, offsetY: (1000 - 562.5) / 2 }],
    [2000, 1080, { scale: 1, offsetX: 40, offsetY: 0 }],
  ])('computeScale(%i, %i)', (w, h, esperado) => {
    const r = computeScale(w, h)
    expect(r.scale).toBeCloseTo(esperado.scale, 6)
    expect(r.offsetX).toBeCloseTo(esperado.offsetX, 6)
    expect(r.offsetY).toBeCloseTo(esperado.offsetY, 6)
  })

  it.each([
    [0, 0],
    [0, 500],
    [-10, 300],
    [NaN, 400],
    [Infinity, 400],
  ])('contenedor inválido (%s, %s) → escala 0 sin NaN', (w, h) => {
    expect(computeScale(w, h)).toEqual({ scale: 0, offsetX: 0, offsetY: 0 })
  })
})

describe('área segura (§5.1)', () => {
  it('lienzo y área segura', () => {
    expect(CANVAS).toEqual({ width: 1920, height: 1080 })
    expect(SAFE_AREA).toEqual({ x: 96, y: 64, width: 1728, height: 952 })
  })

  it('isInsideSafeArea con bordes inclusivos', () => {
    expect(isInsideSafeArea(SAFE_AREA)).toBe(true)
    expect(isInsideSafeArea({ x: 95, y: 64, width: 10, height: 10 })).toBe(false)
    expect(isInsideSafeArea({ x: 96, y: 63, width: 10, height: 10 })).toBe(false)
    expect(isInsideSafeArea({ x: 1814, y: 64, width: 10, height: 10 })).toBe(true) // borde derecho 1824
    expect(isInsideSafeArea({ x: 1815, y: 64, width: 10, height: 10 })).toBe(false)
    expect(isInsideSafeArea({ x: 96, y: 1006, width: 10, height: 10 })).toBe(true) // borde inferior 1016
    expect(isInsideSafeArea({ x: 96, y: 1007, width: 10, height: 10 })).toBe(false)
  })
})
