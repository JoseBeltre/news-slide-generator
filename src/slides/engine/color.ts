// Color y contraste según WCAG 2.x (§5.5). Todo es determinista: mismo color, mismo resultado.

export type Rgb = { r: number; g: number; b: number }

export class InvalidColorError extends Error {
  constructor(input: string) {
    super(`Color no válido: ${JSON.stringify(input)}`)
    this.name = 'InvalidColorError'
  }
}

export const TEXT_LIGHT = '#ffffff'
export const TEXT_DARK = '#000000'

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const RGB = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i

/** Acepta `#rgb`, `#rrggbb`, `rgb(r, g, b)` y `rgba(r, g, b, a)` (ignora `a`). */
export function parseColor(input: string): Rgb {
  const s = input.trim()
  const hex = HEX.exec(s)
  if (hex) {
    let h = hex[1]!
    if (h.length === 3) h = [...h].map((c) => c + c).join('')
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    }
  }
  const rgb = RGB.exec(s)
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map(Number) as [number, number, number]
    if ([r, g, b].every((c) => c <= 255)) return { r, g, b }
  }
  throw new InvalidColorError(input)
}

export function toHex(c: Rgb): string {
  const h = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}

const asRgb = (c: Rgb | string): Rgb => (typeof c === 'string' ? parseColor(c) : c)

export function relativeLuminance(color: Rgb | string): number {
  const { r, g, b } = asRgb(color)
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(a: Rgb | string, b: Rgb | string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Contraste de `color` contra la peor de las paradas de fondo (degradados). */
export function minContrastAgainst(color: string, backgrounds: readonly string[]): number {
  return Math.min(...backgrounds.map((bg) => contrastRatio(color, bg)))
}

/** Texto claro u oscuro, el que mejor contraste mínimo tenga contra todas las paradas. Empate → claro. */
export function pickTextColor(background: string | readonly string[]): { color: string; ratio: number } {
  const stops = typeof background === 'string' ? [background] : background
  const light = minContrastAgainst(TEXT_LIGHT, stops)
  const dark = minContrastAgainst(TEXT_DARK, stops)
  return dark > light ? { color: TEXT_DARK, ratio: dark } : { color: TEXT_LIGHT, ratio: light }
}

// ---- HSL (h en grados, s en 0–1, l en 0–100) ----

type Hsl = { h: number; s: number; l: number }

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: (h * 60 + 360) % 360, s, l: l * 100 }
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 }
}

const hexAt = (base: Hsl, l: number) => toHex(hslToRgb({ ...base, l: Math.min(100, Math.max(0, l)) }))

/**
 * Busca, manteniendo tono y saturación, la luminosidad más cercana a la original con la que `text`
 * alcanza `min` sobre el fondo. `direction` -1 oscurece (texto claro) y +1 aclara (texto oscuro).
 */
function searchLightness(base: Hsl, text: string, min: number, direction: -1 | 1): { hex: string; l: number } {
  const passes = (l: number) => contrastRatio(text, hexAt(base, l)) >= min
  // `far` siempre cumple (negro o blanco puro); `near` es la luminosidad original, que no cumple.
  let far = direction === -1 ? 0 : 100
  let near = base.l
  for (let i = 0; i < 30; i++) {
    const mid = (far + near) / 2
    if (passes(mid)) far = mid
    else near = mid
  }
  // El redondeo a hex puede dejarlo justo por debajo: alejarse medio punto hasta cumplir.
  let l = far
  while (!passes(l)) l += direction * 0.5
  return { hex: hexAt(base, l), l }
}

export interface ContrastResult {
  background: string
  text: string
  ratio: number
  adjusted: boolean
}

/** Garantiza texto ≥ `min` sobre el fondo; si ni blanco ni negro alcanzan, ajusta la luminosidad del fondo. */
export function ensureContrast(background: string, min = 7): ContrastResult {
  if (!(min >= 1 && min <= 21)) throw new RangeError(`Contraste mínimo fuera de rango (1–21): ${min}`)
  const bg = toHex(parseColor(background))
  const best = pickTextColor(bg)
  if (best.ratio >= min) return { background: bg, text: best.color, ratio: best.ratio, adjusted: false }

  const base = rgbToHsl(parseColor(bg))
  const darker = searchLightness(base, TEXT_LIGHT, min, -1)
  const lighter = searchLightness(base, TEXT_DARK, min, 1)
  const useDarker = Math.abs(base.l - darker.l) <= Math.abs(lighter.l - base.l)
  const chosen = useDarker ? { bg: darker.hex, text: TEXT_LIGHT } : { bg: lighter.hex, text: TEXT_DARK }
  return { background: chosen.bg, text: chosen.text, ratio: contrastRatio(chosen.text, chosen.bg), adjusted: true }
}
