import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../../../src/slides/engine/color'
import { clampLogoHeight, selectLogoVariant, type LogoCandidate } from '../../../src/slides/engine/logo'

const blanco: LogoCandidate = { id: 'b', color: 'blanco', orientation: 'horizontal' }
const negro: LogoCandidate = { id: 'n', color: 'negro', orientation: 'horizontal' }
const rojo: LogoCandidate = { id: 'c', color: 'color', dominantColor: '#c62828', orientation: 'horizontal' }
const amarillo: LogoCandidate = { id: 'y', color: 'color', dominantColor: '#ffeb3b', orientation: 'horizontal' }
const blancoV: LogoCandidate = { id: 'bv', color: 'blanco', orientation: 'vertical' }

describe('selectLogoVariant (RF-37)', () => {
  it('fondo oscuro → blanco sin placa', () => {
    const r = selectLogoVariant([rojo, negro, blanco], '#0b1f3a')!
    expect(r).toMatchObject({ candidate: { id: 'b' }, plate: null })
    expect(r.contrast).toBeCloseTo(contrastRatio('#ffffff', '#0b1f3a'), 6)
  })

  it('fondo claro → a color si contrasta ≥ 3', () => {
    expect(selectLogoVariant([blanco, negro, rojo], '#ffffff')).toMatchObject({ candidate: { id: 'c' }, plate: null })
  })

  it('fondo claro con logo a color poco visible → negro', () => {
    expect(selectLogoVariant([amarillo, negro], '#ffffff')).toMatchObject({ candidate: { id: 'n' }, plate: null })
  })

  it('fondo oscuro sin variante blanca → a color si contrasta', () => {
    expect(selectLogoVariant([negro, amarillo], '#0b1f3a')).toMatchObject({ candidate: { id: 'y' }, plate: null })
  })

  it('sin variante adecuada → mejor disponible sobre placa', () => {
    const r = selectLogoVariant([blanco], '#ffffff')!
    expect(r).toMatchObject({ candidate: { id: 'b' }, plate: '#000000' })
    expect(r.contrast).toBeGreaterThanOrEqual(3)
  })

  it('logo a color igual al fondo → placa', () => {
    const r = selectLogoVariant([rojo], '#c62828')!
    expect(r.plate).not.toBeNull()
    expect(r.contrast).toBeCloseTo(contrastRatio('#c62828', r.plate!), 6)
    expect(r.contrast).toBeGreaterThanOrEqual(3)
  })

  it('orientación pedida si existe; si no, cualquiera', () => {
    expect(selectLogoVariant([blanco, blancoV], '#0b1f3a', { orientation: 'vertical' })!.candidate.id).toBe('bv')
    expect(selectLogoVariant([blanco], '#0b1f3a', { orientation: 'vertical' })!.candidate.id).toBe('b')
  })

  it('degradado: se mide contra la peor parada', () => {
    const r = selectLogoVariant([blanco, negro], ['#0b1f3a', '#f5f5f5'])!
    expect(r.plate).not.toBeNull()
  })

  it('sin logos → null (la plantilla no deja hueco)', () => {
    expect(selectLogoVariant([], '#000000')).toBeNull()
  })

  it('determinista', () => {
    expect(selectLogoVariant([rojo, negro, blanco], '#777777')).toEqual(
      selectLogoVariant([rojo, negro, blanco], '#777777'),
    )
  })
})

describe('clampLogoHeight (RF-39)', () => {
  it('normal entre 90 y 160; portada hasta 400', () => {
    expect(clampLogoHeight(50)).toBe(90)
    expect(clampLogoHeight(200)).toBe(160)
    expect(clampLogoHeight(120)).toBe(120)
    expect(clampLogoHeight(300, { cover: true })).toBe(300)
    expect(clampLogoHeight(900, { cover: true })).toBe(400)
    expect(clampLogoHeight(10, { cover: true })).toBe(90)
  })
})
