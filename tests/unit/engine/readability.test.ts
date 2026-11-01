import { describe, expect, it } from 'vitest'
import {
  LINE_HEIGHT,
  LOGO_HEIGHT,
  MIN_CONTRAST,
  ReadabilityViolation,
  TEXT_ROLES,
  checkDensity,
  countWords,
  resolveFontRange,
  validateTextSlot,
} from '../../../src/slides/engine/readability'
import { ensureContrast } from '../../../src/slides/engine/color'
import type { TextSlotDef } from '../../../src/slides/engine/types'

const slot = (p: Partial<TextSlotDef> = {}): TextSlotDef => ({
  id: 't',
  role: 'title',
  box: { x: 96, y: 64, width: 1728, height: 300 },
  ...p,
})

describe('constantes de §5', () => {
  it('tabla de roles igual a §5.3', () => {
    expect(TEXT_ROLES.title).toEqual({ min: 84, preferredMin: 104, preferredMax: 132, weight: 700, lineHeight: 1.05 })
    expect(TEXT_ROLES.key).toEqual({ min: 60, preferredMin: 70, preferredMax: 84, weight: 700, lineHeight: 1.2 })
    expect(TEXT_ROLES.secondary).toEqual({ min: 44, preferredMin: 52, preferredMax: 56, weight: 400, lineHeight: 1.1 })
    expect(TEXT_ROLES.birthdayNameSingle).toEqual({ min: 108, preferredMin: 140, preferredMax: 230, weight: 700, lineHeight: 1.05 })
    expect(TEXT_ROLES.birthdayNameGroup).toEqual({ min: 54, preferredMin: 62, preferredMax: 84, weight: 700, lineHeight: 1.05 })
    expect(TEXT_ROLES.meta).toEqual({ min: 32, preferredMin: 35, preferredMax: 35, weight: 400, lineHeight: 1.2 })
  })

  it('contraste, interlineado y logo', () => {
    expect(MIN_CONTRAST).toBe(7)
    expect(LINE_HEIGHT).toBe(1.2)
    expect(LOGO_HEIGHT).toEqual({ min: 90, max: 160, coverMax: 400 })
  })

  it('ensureContrast usa MIN_CONTRAST por defecto', () => {
    expect(ensureContrast('#777777').ratio).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })
})

describe('resolveFontRange', () => {
  it('nunca baja del mínimo del rol', () => {
    expect(resolveFontRange(slot())).toEqual({ min: 84, max: 132 })
    expect(resolveFontRange(slot({ minFontSize: 50 }))).toEqual({ min: 84, max: 132 })
    expect(resolveFontRange(slot({ minFontSize: 110, maxFontSize: 140 }))).toEqual({ min: 110, max: 140 })
    expect(resolveFontRange(slot({ role: 'birthdayNameSingle' }))).toEqual({ min: 108, max: 230 })
  })
})

describe('validateTextSlot', () => {
  it.each([
    [{ minFontSize: 80 }, 'font_below_min'],
    [{ maxFontSize: 80 }, 'invalid_range'],
    [{ box: { x: 0, y: 64, width: 500, height: 200 } }, 'outside_safe_area'],
    [{ uppercase: true }, 'uppercase_multiline'],
    [{ uppercase: true, maxLines: 2 }, 'uppercase_multiline'],
  ] as [Partial<TextSlotDef>, ReadabilityViolation['code']][])('%o → %s', (p, code) => {
    expect(() => validateTextSlot(slot(p))).toThrow(ReadabilityViolation)
    expect(() => validateTextSlot(slot(p))).toThrow(expect.objectContaining({ code }))
  })

  it('un slot correcto, también en mayúsculas de una línea, es válido', () => {
    expect(() => validateTextSlot(slot())).not.toThrow()
    expect(() => validateTextSlot(slot({ uppercase: true, maxLines: 1 }))).not.toThrow()
  })
})

describe('densidad (§5.4)', () => {
  it('countWords', () => {
    expect(countWords('  Culto   de\njóvenes ')).toBe(3)
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
  })

  it('checkDensity', () => {
    expect(checkDensity({ infoLines: 6, runningText: ['uno dos'] })).toEqual([])
    expect(checkDensity({ infoLines: 7, runningText: [] })).toEqual([{ code: 'too_many_lines', actual: 7, limit: 6 }])
    const largo = Array.from({ length: 41 }, () => 'palabra').join(' ')
    expect(checkDensity({ infoLines: 1, runningText: [largo] })).toEqual([
      { code: 'too_many_words', actual: 41, limit: 40 },
    ])
    expect(checkDensity({ infoLines: 1, runningText: ['uno dos', 'tres'] })).toEqual([])
  })
})
