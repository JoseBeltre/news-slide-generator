import { expect, it } from 'vitest'

it('Atkinson Hyperlegible 400 y 700 se cargan desde el bundle', async () => {
  const r400 = await document.fonts.load('400 100px "Atkinson Hyperlegible"')
  const r700 = await document.fonts.load('700 100px "Atkinson Hyperlegible"')
  expect(r400.length).toBeGreaterThan(0)
  expect(r700.length).toBeGreaterThan(0)
})
