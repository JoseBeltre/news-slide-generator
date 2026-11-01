import { describe, expect, it } from 'vitest'
import { InvalidColorError, contrastRatio, minContrastAgainst } from '../../../src/slides/engine'
import {
  NEUTRAL_THEME_ID,
  PRESET_THEMES,
  TYPE_ACCENTS,
  deriveTheme,
  resolveTheme,
  type ResolvedTheme,
} from '../../../src/slides/themes'
import type { AnnouncementTypeId } from '../../../src/slides/types/fields'

const TYPES = Object.keys(TYPE_ACCENTS) as AnnouncementTypeId[]

function expectReadable({ palette }: ResolvedTheme, label: string) {
  for (const stop of palette.background) expect(contrastRatio(palette.text, stop), `${label} texto/${stop}`).toBeGreaterThanOrEqual(7)
  expect(contrastRatio(palette.onAccent, palette.accent), `${label} onAccent`).toBeGreaterThanOrEqual(7)
  expect(minContrastAgainst(palette.accent, palette.background), `${label} acento/fondo`).toBeGreaterThanOrEqual(3)
}

describe('temas predefinidos (RF-31, RF-33)', () => {
  it('cada tema × cada tipo cumple 7:1 en el texto y 3:1 en el acento', () => {
    expect(PRESET_THEMES.length).toBeGreaterThanOrEqual(6)
    for (const theme of PRESET_THEMES) {
      expectReadable(resolveTheme(theme), theme.id)
      for (const t of TYPES) expectReadable(resolveTheme(theme, t), `${theme.id}/${t}`)
    }
  })

  it('el tema neutro es azul oscuro con texto blanco', () => {
    const neutro = PRESET_THEMES.find((t) => t.id === NEUTRAL_THEME_ID)!
    const { palette, adjusted } = resolveTheme(neutro)
    expect(palette.background).toEqual(['#0b1f3a', '#12325e'])
    expect(palette.text).toBe('#ffffff')
    expect(adjusted).toBe(false)
    expect(palette.fontFamily).toBe('Atkinson Hyperlegible')
  })

  it('hay al menos un tema claro (texto oscuro)', () => {
    expect(PRESET_THEMES.some((t) => resolveTheme(t).palette.text === '#000000')).toBe(true)
  })
})

describe('deriveTheme: color personalizado (RF-32, §10.9)', () => {
  it.each(['#fff59d', '#ffff00', '#777777', '#000000', '#ffffff', '#1e5aa8'])('%s cumple contraste', (c) => {
    expectReadable(deriveTheme(c), c)
    for (const t of TYPES) expectReadable(deriveTheme(c, t), `${c}/${t}`)
  })

  it('gris medio (ni blanco ni negro llegan a 7:1) → ajustado y avisa', () => {
    const r = deriveTheme('#777777')
    expect(r.adjusted).toBe(true)
    expect(r.warning).toBe('Ajustamos el color para que el texto se lea bien en la pantalla.')
  })

  it('un color que ya cumple no se ajusta ni avisa', () => {
    for (const c of ['#000000', '#ffffff', '#0b1f3a']) {
      const r = deriveTheme(c)
      expect(r.adjusted, c).toBe(false)
      expect(r.warning, c).toBeUndefined()
      expect(r.palette.background[0], c).toBe(c)
    }
  })

  it('color inválido → InvalidColorError', () => {
    expect(() => deriveTheme('rojo')).toThrow(InvalidColorError)
  })

  it('determinista', () => {
    expect(deriveTheme('#fff59d', 'culto')).toEqual(deriveTheme('#fff59d', 'culto'))
  })
})
