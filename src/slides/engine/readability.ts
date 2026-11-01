// Reglas de legibilidad de §5. Las impone el motor, no el usuario (C-04).
import { isInsideSafeArea } from './canvas'
import type { TextRole, TextSlotDef } from './types'

export const MIN_CONTRAST = 7
export const LOGO_MIN_CONTRAST = 3
export const LINE_HEIGHT = 1.2
export const MAX_INFO_LINES = 6
export const MAX_RUNNING_WORDS = 40
export const ICON_MIN_PX = 64
export const LOGO_HEIGHT = { min: 90, max: 160, coverMax: 400 } as const

export interface TextRoleRule {
  min: number
  preferredMin: number
  preferredMax: number
  weight: 400 | 700
}

// §5.3 (px sobre el lienzo de 1080 de alto) y pesos de §5.2.
export const TEXT_ROLES: Readonly<Record<TextRole, TextRoleRule>> = Object.freeze({
  title: { min: 96, preferredMin: 120, preferredMax: 150, weight: 700 },
  key: { min: 68, preferredMin: 80, preferredMax: 96, weight: 700 },
  secondary: { min: 52, preferredMin: 60, preferredMax: 64, weight: 400 },
  birthdayNameSingle: { min: 120, preferredMin: 160, preferredMax: 260, weight: 700 },
  birthdayNameGroup: { min: 60, preferredMin: 72, preferredMax: 96, weight: 700 },
  meta: { min: 36, preferredMin: 40, preferredMax: 40, weight: 400 },
})

export type ReadabilityViolationCode = 'font_below_min' | 'invalid_range' | 'outside_safe_area' | 'uppercase_multiline'

export class ReadabilityViolation extends Error {
  constructor(
    readonly code: ReadabilityViolationCode,
    message: string,
  ) {
    super(message)
    this.name = 'ReadabilityViolation'
  }
}

/** Rango de búsqueda de tamaño para un slot. El mínimo nunca queda por debajo del rol. */
export function resolveFontRange(slot: TextSlotDef): { min: number; max: number } {
  const rule = TEXT_ROLES[slot.role]
  return {
    min: Math.max(rule.min, slot.minFontSize ?? 0),
    max: slot.maxFontSize ?? rule.preferredMax,
  }
}

/** Valida la definición de un slot de plantilla; lanza `ReadabilityViolation` si rompe §5. */
export function validateTextSlot(slot: TextSlotDef): void {
  const rule = TEXT_ROLES[slot.role]
  if (slot.minFontSize !== undefined && slot.minFontSize < rule.min) {
    throw new ReadabilityViolation(
      'font_below_min',
      `Slot "${slot.id}": minFontSize ${slot.minFontSize} < mínimo ${rule.min} del rol ${slot.role}`,
    )
  }
  const { min, max } = resolveFontRange(slot)
  if (max < min) {
    throw new ReadabilityViolation('invalid_range', `Slot "${slot.id}": maxFontSize ${max} < minFontSize ${min}`)
  }
  if (!isInsideSafeArea(slot.box)) {
    throw new ReadabilityViolation('outside_safe_area', `Slot "${slot.id}": la caja sale del área segura`)
  }
  if (slot.uppercase && slot.maxLines !== 1) {
    throw new ReadabilityViolation(
      'uppercase_multiline',
      `Slot "${slot.id}": mayúsculas sostenidas solo en slots de una línea`,
    )
  }
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export interface DensityViolation {
  code: 'too_many_lines' | 'too_many_words'
  actual: number
  limit: number
}

/** §5.4: máximo 6 líneas informativas (sin el título) y ~40 palabras de texto corrido. */
export function checkDensity(input: { infoLines: number; runningText: readonly string[] }): DensityViolation[] {
  const out: DensityViolation[] = []
  if (input.infoLines > MAX_INFO_LINES) {
    out.push({ code: 'too_many_lines', actual: input.infoLines, limit: MAX_INFO_LINES })
  }
  const words = input.runningText.reduce((n, t) => n + countWords(t), 0)
  if (words > MAX_RUNNING_WORDS) {
    out.push({ code: 'too_many_words', actual: words, limit: MAX_RUNNING_WORDS })
  }
  return out
}
