// Temas de color de las slides (RF-31…33, §5.5, §9). Son propios de las slides: no dependen del
// sistema de diseño de la interfaz. Todo tema se "resuelve" a una paleta que ya cumple el contraste.
import type { Theme } from '../data/models'
import {
  LOGO_MIN_CONTRAST,
  MIN_CONTRAST,
  TEXT_DARK,
  TEXT_LIGHT,
  contrastRatio,
  ensureContrast,
  ensureGradientContrast,
  minContrastAgainst,
  parseColor,
  toHex,
} from './engine'
import type { AnnouncementTypeId } from './types/fields'

export interface SlidePalette {
  /** 1 color (sólido) o 2 paradas (degradado suave); `text` llega a 7:1 contra todas. */
  background: string[]
  text: string
  /** Decoración, bandas y chip de ícono: ≥ 3:1 contra el fondo. Nunca color de texto informativo. */
  accent: string
  /** Texto o ícono sobre el acento: ≥ 7:1. */
  onAccent: string
  /**
   * Campo de color grande (hoja, franja): el color del tipo tal cual, sin acercarlo al fondo, para que
   * no se vuelva color barro en los temas claros. Solo se ajusta si su texto no llega a 7:1.
   */
  field: string
  onField: string
  fontFamily: string
}

export interface ResolvedTheme {
  palette: SlidePalette
  /** Se cambió el fondo pedido para llegar a 7:1. */
  adjusted: boolean
  warning?: string
}

export const NEUTRAL_THEME_ID = 'neutro'
const FONT = 'Atkinson Hyperlegible'
const PRESET_DATE = '2026-11-01T00:00:00.000Z'
const ADJUSTED_WARNING = 'Ajustamos el color para que el texto se lea bien en la pantalla.'

const preset = (id: string, name: string, background: string, secondary: string, primary: string): Theme => ({
  id,
  updatedAt: PRESET_DATE,
  name,
  background,
  secondary,
  primary,
  fontFamily: FONT,
})

/** `background` → `secondary` es el degradado del fondo; `primary`, el acento de portada y cierre. */
export const PRESET_THEMES: readonly Theme[] = Object.freeze([
  preset(NEUTRAL_THEME_ID, 'Neutro', '#0b1f3a', '#12325e', '#f2b632'),
  preset('vino', 'Vino', '#3d0f1f', '#5a1730', '#f2b632'),
  preset('bosque', 'Bosque', '#0f2e22', '#164532', '#9ed36a'),
  preset('pizarra', 'Pizarra', '#1c1f24', '#2b3038', '#5ec8e5'),
  preset('cielo', 'Cielo', '#eaf3fb', '#d7e8f6', '#1e5aa8'),
  preset('arena', 'Arena', '#faf4e8', '#f1e6cf', '#8a4b14'),
])

/** Identidad por tipo (§9): color de acento reconocible de un vistazo. */
export const TYPE_ACCENTS: Readonly<Record<AnnouncementTypeId, string>> = Object.freeze({
  culto: '#f2b632',
  salida: '#2e9e5b',
  obra_misionera: '#e07a2e',
  cumpleanos: '#e0569b',
  actividad: '#7b5cd6',
  aviso: '#d64545',
  imagen: '#8a8f98',
})

const mix = (color: string, target: string, t: number) => {
  const a = parseColor(color)
  const b = parseColor(target)
  return toHex({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t })
}

/**
 * Acerca el acento a blanco (fondo oscuro) o a negro (fondo claro) en pasos fijos hasta que se
 * distinga del fondo (3:1) y su texto llegue a 7:1. Blanco o negro puros siempre cumplen.
 */
function fitAccent(accent: string, background: readonly string[], text: string): { accent: string; onAccent: string } {
  const darkBackground = text === TEXT_LIGHT
  const target = darkBackground ? TEXT_LIGHT : TEXT_DARK
  const onAccent = darkBackground ? TEXT_DARK : TEXT_LIGHT
  for (let step = 0; step <= 50; step++) {
    const candidate = mix(accent, target, step / 50)
    if (minContrastAgainst(candidate, background) >= LOGO_MIN_CONTRAST && contrastRatio(onAccent, candidate) >= MIN_CONTRAST) {
      return { accent: candidate, onAccent }
    }
  }
  return { accent: target, onAccent }
}

/**
 * Tinta con el tono del acento para texto informativo (p. ej. la fecha protagonista): el acento acercado
 * al color de texto del fondo hasta llegar a 7:1 contra todas las paradas. Determinista.
 */
export function accentInk(accent: string, background: readonly string[], text: string): string {
  for (let step = 0; step <= 50; step++) {
    const candidate = mix(accent, text, step / 50)
    if (minContrastAgainst(candidate, background) >= MIN_CONTRAST) return candidate
  }
  return text
}

/** Mezcla `color` con `target` en proporción `t` (0–1). Para capas y texturas de las plantillas. */
export const mixColors = (color: string, target: string, t: number) => mix(color, target, t)

function build(stops: readonly string[], accent: string, fontFamily: string): ResolvedTheme {
  const fixed = ensureGradientContrast(stops)
  const field = ensureContrast(accent)
  return {
    palette: {
      background: fixed.stops,
      text: fixed.text,
      ...fitAccent(accent, fixed.stops, fixed.text),
      field: field.background,
      onField: field.text,
      fontFamily,
    },
    adjusted: fixed.adjusted,
    ...(fixed.adjusted ? { warning: ADJUSTED_WARNING } : {}),
  }
}

const solidOrGradient = (a: string, b: string) => {
  const [x, y] = [toHex(parseColor(a)), toHex(parseColor(b))]
  return x === y ? [x] : [x, y]
}

/** Paleta de un tema guardado o predefinido; con `typeId`, el acento es el del tipo (§9). */
export function resolveTheme(theme: Theme, typeId?: AnnouncementTypeId): ResolvedTheme {
  const accent = typeId ? TYPE_ACCENTS[typeId] : theme.primary
  return build(solidOrGradient(theme.background, theme.secondary), accent, theme.fontFamily)
}

/**
 * Tema a partir de un color primario personalizado (RF-32): el color es el fondo, con un degradado
 * suave hacia un tono un poco más oscuro. Si el texto no llega a 7:1, se ajusta la luminosidad y avisa.
 */
export function deriveTheme(primary: string, typeId?: AnnouncementTypeId): ResolvedTheme {
  const base = toHex(parseColor(primary))
  const accent = typeId ? TYPE_ACCENTS[typeId] : base
  return build(solidOrGradient(base, mix(base, TEXT_DARK, 0.12)), accent, FONT)
}
