import { describe, expect, it } from 'vitest'
import {
  InvalidColorError,
  contrastRatio,
  ensureContrast,
  minContrastAgainst,
  parseColor,
  pickTextColor,
  relativeLuminance,
  toHex,
} from '../../../src/slides/engine/color'

describe('luminancia y contraste WCAG 2.x', () => {
  it('valores de referencia', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 6)
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 6)
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrastRatio('#0b1f3a', '#ffffff')).toBeGreaterThan(15)
  })

  it('es simétrico', () => {
    expect(contrastRatio('#123456', '#abcdef')).toBeCloseTo(contrastRatio('#abcdef', '#123456'), 10)
  })

  it('minContrastAgainst toma la peor parada', () => {
    const peor = minContrastAgainst('#ffffff', ['#000000', '#777777'])
    expect(peor).toBeCloseTo(contrastRatio('#ffffff', '#777777'), 10)
  })
})

describe('parseColor y toHex', () => {
  it('acepta hex corto, largo y rgb()/rgba()', () => {
    expect(parseColor('#ABC')).toEqual({ r: 170, g: 187, b: 204 })
    expect(parseColor('#0b1F3a')).toEqual({ r: 11, g: 31, b: 58 })
    expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30 })
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual({ r: 10, g: 20, b: 30 })
  })

  it.each(['', 'abc', '#12345', '#ggg', 'red', 'rgb(300, 0, 0)'])('rechaza %j', (malo) => {
    expect(() => parseColor(malo)).toThrow(InvalidColorError)
  })

  it('toHex en minúsculas con dos dígitos', () => {
    expect(toHex({ r: 11, g: 31, b: 58 })).toBe('#0b1f3a')
  })
})

describe('pickTextColor', () => {
  it('fondo oscuro → blanco; fondo claro → negro', () => {
    expect(pickTextColor('#0b1f3a').color).toBe('#ffffff')
    expect(pickTextColor('#fff59d').color).toBe('#000000')
  })

  it('degradado: usa el contraste mínimo contra todas las paradas', () => {
    const deg = pickTextColor(['#0b1f3a', '#1e3a8a'])
    expect(deg.color).toBe('#ffffff')
    expect(deg.ratio).toBeCloseTo(minContrastAgainst('#ffffff', ['#0b1f3a', '#1e3a8a']), 6)
  })
})

describe('ensureContrast (≥ 7:1)', () => {
  it('amarillo claro personalizado → texto ≥ 7:1 sin ajustar (criterio §10.9)', () => {
    const r = ensureContrast('#fff59d')
    expect(r).toMatchObject({ background: '#fff59d', text: '#000000', adjusted: false })
    expect(r.ratio).toBeGreaterThanOrEqual(7)
  })

  it('gris medio: ni blanco ni negro llegan a 7:1 → ajusta el fondo', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(7)
    expect(contrastRatio('#777777', '#000000')).toBeLessThan(7)
    const r = ensureContrast('#777777')
    expect(r.adjusted).toBe(true)
    expect(r.background).not.toBe('#777777')
    expect(contrastRatio(r.text, r.background)).toBeGreaterThanOrEqual(7)
  })

  const MUESTRA = [
    '#ff0000', '#00ff00', '#0000ff', '#ff9800', '#9c27b0', '#808080',
    '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#3f51b5', '#795548',
  ]
  it.each(MUESTRA)('ensureContrast(%s) siempre ≥ 7:1 y determinista', (c) => {
    const a = ensureContrast(c)
    const b = ensureContrast(c)
    expect(a).toEqual(b)
    expect(contrastRatio(a.text, a.background)).toBeGreaterThanOrEqual(7)
    expect(a.ratio).toBeCloseTo(contrastRatio(a.text, a.background), 6)
  })

  it('un mínimo imposible (> 21:1) lanza RangeError en lugar de colgarse', () => {
    expect(() => ensureContrast('#777777', 22)).toThrow(RangeError)
  })

  it('respeta un mínimo distinto', () => {
    const r = ensureContrast('#777777', 4.5)
    expect(r.ratio).toBeGreaterThanOrEqual(4.5)
  })
})
