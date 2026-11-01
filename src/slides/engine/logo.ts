// Selección automática de la variante de logo según el fondo (RF-37, §5.5) y su tamaño (RF-39).
import { TEXT_DARK, TEXT_LIGHT, contrastRatio, minContrastAgainst, pickTextColor } from './color'
import { LOGO_HEIGHT, LOGO_MIN_CONTRAST } from './readability'

export type LogoOrientation = 'horizontal' | 'vertical' | 'cuadrado'

export type LogoCandidate = { id: string; orientation: LogoOrientation } & (
  | { color: 'blanco' }
  | { color: 'negro' }
  | { color: 'color'; dominantColor: string }
)

export interface LogoChoice {
  candidate: LogoCandidate
  /** Placa de fondo detrás del logo cuando ninguna variante contrasta lo suficiente. */
  plate: string | null
  contrast: number
}

const representativeColor = (c: LogoCandidate) =>
  c.color === 'blanco' ? TEXT_LIGHT : c.color === 'negro' ? TEXT_DARK : c.dominantColor

/** Variante a usar sobre ese fondo, o `null` si no hay logos (la plantilla no deja hueco). */
export function selectLogoVariant(
  candidates: readonly LogoCandidate[],
  background: string | readonly string[],
  opts: { orientation?: LogoOrientation } = {},
): LogoChoice | null {
  if (candidates.length === 0) return null
  const stops = typeof background === 'string' ? [background] : background

  const sameOrientation = candidates.filter((c) => c.orientation === opts.orientation)
  const pool = sameOrientation.length > 0 ? sameOrientation : candidates

  const darkBackground = pickTextColor(stops).color === TEXT_LIGHT
  const order: LogoCandidate['color'][] = darkBackground ? ['blanco', 'color', 'negro'] : ['color', 'negro', 'blanco']
  const ranked = pool
    .map((candidate, i) => ({ candidate, i, contrast: minContrastAgainst(representativeColor(candidate), stops) }))
    .sort((a, b) => order.indexOf(a.candidate.color) - order.indexOf(b.candidate.color) || a.i - b.i)

  const good = ranked.find((r) => r.contrast >= LOGO_MIN_CONTRAST)
  if (good) return { candidate: good.candidate, plate: null, contrast: good.contrast }

  // Ninguna llega a 3:1: la de mayor contraste (empates por preferencia) sobre una placa blanca o negra.
  const best = ranked.reduce((a, b) => (b.contrast > a.contrast ? b : a))
  const color = representativeColor(best.candidate)
  const plate = contrastRatio(color, TEXT_LIGHT) >= contrastRatio(color, TEXT_DARK) ? TEXT_LIGHT : TEXT_DARK
  return { candidate: best.candidate, plate, contrast: contrastRatio(color, plate) }
}

/** Alto del logo acotado: reconocible sin competir con la información. La portada puede ser mayor. */
export function clampLogoHeight(height: number, opts: { cover?: boolean } = {}): number {
  const max = opts.cover ? LOGO_HEIGHT.coverMax : LOGO_HEIGHT.max
  return Math.min(max, Math.max(LOGO_HEIGHT.min, height))
}
