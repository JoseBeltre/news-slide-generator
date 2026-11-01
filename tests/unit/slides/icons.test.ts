import { describe, expect, it } from 'vitest'
import { ICONS, iconFor } from '../../../src/slides/icons'
import { ANNOUNCEMENT_TYPES } from '../../../src/slides/types/definitions'

describe('íconos locales (§5.4)', () => {
  it('cada ícono de tipos y campos existe en el registro', () => {
    const names = ANNOUNCEMENT_TYPES.flatMap((t) => [t.icon, ...t.fields.map((f) => f.icon)]).filter(Boolean) as string[]
    for (const n of names) expect(ICONS[n], n).toBeDefined()
  })

  it('desconocido → undefined', () => {
    expect(iconFor('nada')).toBeUndefined()
    expect(iconFor(undefined)).toBeUndefined()
  })
})
