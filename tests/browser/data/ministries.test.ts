import { expect, it } from 'vitest'
import { PRELOADED_MINISTRIES } from '../../../src/data/ministries'
import { dominantColorOfBlob } from '../../../src/lib/dominantColor'
import { parseColor } from '../../../src/slides/engine/color'

const DECLARED = { negro: '#12100b', blanco: '#ffffff' } as const

it('cada logo precargado se ve del color que declara', async () => {
  for (const logo of PRELOADED_MINISTRIES.flatMap((m) => m.logos)) {
    if (logo.source.kind !== 'asset') throw new Error('se esperaba asset')
    const res = await fetch(logo.source.src)
    expect(res.ok).toBe(true)
    const blob = await res.blob()
    const actual = await dominantColorOfBlob(new Blob([blob], { type: 'image/svg+xml' }))
    expect(actual, logo.source.src).not.toBeNull()
    const a = parseColor(actual!)
    const e = parseColor(logo.color === 'color' ? logo.dominantColor! : DECLARED[logo.color])
    for (const ch of ['r', 'g', 'b'] as const) expect(Math.abs(a[ch] - e[ch]), `${logo.source.src} ${ch}`).toBeLessThanOrEqual(8)
  }
})
