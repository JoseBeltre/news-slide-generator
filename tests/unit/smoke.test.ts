import { expect, it } from 'vitest'
import { DEFAULT_FONT_FAMILY } from '../../src/slides/fonts-family'

it('la familia por defecto es Atkinson Hyperlegible', () => {
  expect(DEFAULT_FONT_FAMILY).toBe('Atkinson Hyperlegible')
})
