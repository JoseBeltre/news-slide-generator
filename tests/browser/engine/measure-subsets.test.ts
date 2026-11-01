// Archivo propio: cada archivo de pruebas corre en un iframe nuevo, sin fuentes cargadas aún.
import { expect, it } from 'vitest'
import { ensureFontLoaded } from '../../../src/slides/engine/measure'

const F = 'Atkinson Hyperlegible'

it('ensureFontLoaded también carga el subconjunto Latin Extended (nombres como "Łukasz" o "Ștefan")', async () => {
  await ensureFontLoaded(F)
  for (const weight of [400, 700]) {
    expect(document.fonts.check(`${weight} 100px "${F}"`, 'Łukasz Ștefan Đorđe')).toBe(true)
  }
})
