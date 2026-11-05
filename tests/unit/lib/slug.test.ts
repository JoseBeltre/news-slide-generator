import { describe, expect, it } from 'vitest'
import { slugify } from '../../../src/lib/slug'

describe('slugify', () => {
  it('minúsculas, sin acentos ni signos, guiones simples', () => {
    expect(slugify('Culto de Jóvenes')).toBe('culto-de-jovenes')
    expect(slugify('¡¡Hola!!')).toBe('hola')
    expect(slugify('  Año   nuevo -- 2027 ')).toBe('ano-nuevo-2027')
  })

  it('corta a 40 caracteres', () => {
    expect(slugify('a'.repeat(60))).toHaveLength(40)
  })
})
