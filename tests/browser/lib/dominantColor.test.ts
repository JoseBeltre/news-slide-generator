import { describe, expect, it } from 'vitest'
import { dominantColorOfBlob } from '../../../src/lib/dominantColor'
import { parseColor } from '../../../src/slides/engine'

const close = (actual: string | null, expected: string, tolerance: number) => {
  expect(actual).not.toBeNull()
  const a = parseColor(actual!)
  const e = parseColor(expected)
  for (const ch of ['r', 'g', 'b'] as const) expect(Math.abs(a[ch] - e[ch])).toBeLessThanOrEqual(tolerance)
}

describe('dominantColorOfBlob', () => {
  it('SVG solo con viewBox: rect azul en el 80 % del área', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<rect width="100" height="100" fill="#ffffff"/><rect width="100" height="80" fill="#1e5aa8"/></svg>'
    close(await dominantColorOfBlob(new Blob([svg], { type: 'image/svg+xml' })), '#1e5aa8', 1)
  })

  it('PNG con transparencia', async () => {
    const c = new OffscreenCanvas(200, 100)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#c62828'
    ctx.fillRect(0, 0, 60, 100) // el resto queda transparente
    close(await dominantColorOfBlob(await c.convertToBlob({ type: 'image/png' })), '#c62828', 1)
  })

  it('una imagen ilegible → null', async () => {
    expect(await dominantColorOfBlob(new Blob(['nada'], { type: 'image/png' }))).toBeNull()
  })
})
