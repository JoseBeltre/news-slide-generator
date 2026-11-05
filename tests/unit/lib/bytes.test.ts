import { describe, expect, it } from 'vitest'
import { formatBytes } from '../../../src/lib/bytes'

describe('formatBytes', () => {
  it('base 1024 con la coma de es-DO', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1536)).toBe(`${new Intl.NumberFormat('es-DO').format(1.5)} KB`)
    expect(formatBytes(5 * 1024 ** 2)).toBe('5 MB')
    expect(formatBytes(3 * 1024 ** 3)).toBe('3 GB')
  })
})
