// Medición del texto en el DOM (§5.6, pasos 1–3). Solo mide con la fuente real ya cargada:
// medir con la fuente de respaldo daría tamaños que luego no caben.
import { findLargestFittingSize } from './fit'
import { LINE_HEIGHT, TEXT_ROLES, resolveFontRange } from './readability'
import type { FitResult, TextSlotDef } from './types'

export class FontNotLoadedError extends Error {
  constructor(family: string, weight: number) {
    super(`La fuente "${family}" (${weight}) no está cargada; no se puede medir el texto`)
    this.name = 'FontNotLoadedError'
  }
}

const loadedFaces = new Set<string>()
const faceKey = (family: string, weight: number) => `${family}|${weight}`

// Un carácter de cada subconjunto (latin y latin-ext): sin texto, load() solo baja el subconjunto
// que contiene el espacio, y un nombre como "Łukasz" se mediría con la fuente de respaldo.
const SUBSET_SAMPLE = 'AĀ'

/** Carga los pesos de la familia (todos sus subconjuntos); lanza `FontNotLoadedError` si alguno no existe. */
export async function ensureFontLoaded(family: string, weights: readonly (400 | 700)[] = [400, 700]): Promise<void> {
  for (const weight of weights) {
    if (loadedFaces.has(faceKey(family, weight))) continue
    const faces = await document.fonts.load(`${weight} 100px "${family}"`, SUBSET_SAMPLE)
    if (faces.length === 0) throw new FontNotLoadedError(family, weight)
    loadedFaces.add(faceKey(family, weight))
  }
}

/** Recorta, colapsa espacios y tabulaciones, y conserva como mucho un salto de línea seguido. */
export function normalizeSlotText(text: string): string {
  return text
    .replace(/[ \t\f\v\r]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n+/g, '\n')
    .trim()
}

let probeEl: HTMLDivElement | undefined

function getProbe(): HTMLDivElement {
  if (probeEl?.isConnected) return probeEl
  const host = document.createElement('div')
  host.setAttribute('data-measure-host', '')
  host.setAttribute('aria-hidden', 'true')
  host.lang = 'es-DO'
  host.style.cssText = 'position:fixed;left:-20000px;top:0;visibility:hidden;contain:layout;pointer-events:none'
  probeEl = document.createElement('div')
  host.appendChild(probeEl)
  document.body.appendChild(host)
  return probeEl
}

/** Mayor tamaño con el que el texto cabe en su slot sin bajar del mínimo del rol. Síncrona. */
export function measureTextFit(text: string, slot: TextSlotDef, opts: { fontFamily: string }): FitResult {
  const rule = TEXT_ROLES[slot.role]
  if (!loadedFaces.has(faceKey(opts.fontFamily, rule.weight))) {
    throw new FontNotLoadedError(opts.fontFamily, rule.weight)
  }

  const content = normalizeSlotText(text)
  if (content === '') return { status: 'empty' }

  const el = getProbe()
  // Sin cortes a mitad de palabra: una palabra que no entra en el ancho desborda y se detecta.
  el.style.cssText = [
    `width:${slot.box.width}px`,
    'height:auto',
    'overflow:hidden',
    'white-space:pre-line',
    'overflow-wrap:normal',
    'word-break:normal',
    'hyphens:manual',
    `line-height:${LINE_HEIGHT}`,
    `font-family:"${opts.fontFamily}"`,
    `font-weight:${rule.weight}`,
    'font-style:normal',
    `text-transform:${slot.uppercase ? 'uppercase' : 'none'}`,
  ].join(';')
  el.textContent = content

  const measure = (size: number) => {
    el.style.fontSize = `${size}px`
    const height = el.getBoundingClientRect().height
    return { height, lines: Math.round(height / (size * LINE_HEIGHT)), overflowX: el.scrollWidth > slot.box.width }
  }
  const fits = (size: number) => {
    const m = measure(size)
    return !m.overflowX && m.height <= slot.box.height && (slot.maxLines === undefined || m.lines <= slot.maxLines)
  }

  const range = resolveFontRange(slot)
  const size = findLargestFittingSize(range, fits)
  if (size === null) return { status: 'too_long', minFontSize: range.min }
  return { status: 'fits', fontSize: size, lines: measure(size).lines, belowPreferred: size < rule.preferredMin }
}
