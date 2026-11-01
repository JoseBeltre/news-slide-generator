import { describe, expect, it } from 'vitest'
import { dominantColor } from '../../../src/lib/dominantColor'

type Px = [number, number, number, number]

/** Imagen de una fila con los píxeles indicados, en el orden dado. */
function pixels(...groups: [count: number, px: Px][]) {
  const flat: number[] = []
  for (const [count, px] of groups) for (let i = 0; i < count; i++) flat.push(...px)
  const data = new Uint8ClampedArray(flat)
  return { data, width: data.length / 4, height: 1 }
}

const AZUL: Px = [0x1e, 0x5a, 0xa8, 255]
const BLANCO: Px = [255, 255, 255, 255]
const ROJO: Px = [0xc6, 0x28, 0x28, 255]
const TRANSPARENTE: Px = [0, 0, 0, 0]

describe('dominantColor', () => {
  it('color mayoritario', () => {
    expect(dominantColor(pixels([70, AZUL], [30, BLANCO]))).toBe('#1e5aa8')
  })

  it('ignora la transparencia (alfa < 128)', () => {
    expect(dominantColor(pixels([90, TRANSPARENTE], [10, ROJO]))).toBe('#c62828')
    expect(dominantColor(pixels([90, [255, 255, 255, 100]], [10, ROJO]))).toBe('#c62828')
  })

  it('todo transparente o vacío → null', () => {
    expect(dominantColor(pixels([50, TRANSPARENTE]))).toBeNull()
    expect(dominantColor({ data: new Uint8ClampedArray(0), width: 0, height: 0 })).toBeNull()
  })

  it('promedia los tonos parecidos de la misma cubeta (antialiasing)', () => {
    expect(dominantColor(pixels([50, [0x10, 0x20, 0x30, 255]], [50, [0x12, 0x22, 0x32, 255]]))).toBe('#112131')
  })

  it('determinista ante empates: gana la cubeta de clave menor, sin importar el orden', () => {
    const a = dominantColor(pixels([50, BLANCO], [50, AZUL]))
    const b = dominantColor(pixels([50, AZUL], [50, BLANCO]))
    expect(a).toBe('#1e5aa8')
    expect(b).toBe(a)
  })
})
