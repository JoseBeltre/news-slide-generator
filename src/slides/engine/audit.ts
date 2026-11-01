// Auditoría de una slide ya renderizada (§5.7): mínimos de tamaño, área segura, contraste,
// texto que no cabe, tamaño de logo e íconos. La usan las pruebas de plantillas con datos extremos.
//
// Contrato de marcado de las plantillas:
//   texto informativo  → data-role="<TextRole>" (y data-fit lo pone FitText)
//   logo               → data-logo (y data-cover en la portada)
//   ícono de dato      → data-icon
//   fondo degradado    → data-bg="#hex,#hex,…" en el contenedor (el color computado no sirve)
import { CANVAS, isInsideSafeArea } from './canvas'
import { minContrastAgainst, parseColor, toHex } from './color'
import { ICON_MIN_PX, LOGO_HEIGHT, MIN_CONTRAST, TEXT_ROLES } from './readability'
import type { Rect, TextRole } from './types'

export type AuditCode =
  | 'font_below_min'
  | 'outside_safe_area'
  | 'low_contrast'
  | 'text_overflow'
  | 'logo_size'
  | 'icon_size'

export interface AuditViolation {
  code: AuditCode
  element: Element
  detail: string
}

const EPSILON = 0.5 // tolerancia de redondeo al pasar de px de pantalla a px del lienzo

export function auditSlide(canvasEl: HTMLElement): AuditViolation[] {
  const out: AuditViolation[] = []
  const canvasRect = canvasEl.getBoundingClientRect()
  const scale = canvasRect.width / CANVAS.width
  if (!(scale > 0)) return out

  const toCanvas = (el: Element): Rect => {
    const r = el.getBoundingClientRect()
    return {
      x: (r.left - canvasRect.left) / scale,
      y: (r.top - canvasRect.top) / scale,
      width: r.width / scale,
      height: r.height / scale,
    }
  }
  const inside = (rect: Rect) =>
    isInsideSafeArea({
      x: rect.x + EPSILON,
      y: rect.y + EPSILON,
      width: Math.max(0, rect.width - 2 * EPSILON),
      height: Math.max(0, rect.height - 2 * EPSILON),
    })
  const push = (code: AuditCode, element: Element, detail: string) => out.push({ code, element, detail })

  for (const el of canvasEl.querySelectorAll<HTMLElement>('[data-role], [data-logo], [data-icon]')) {
    const rect = toCanvas(el)

    if (el.hasAttribute('data-role')) {
      const role = el.dataset.role as TextRole
      const rule = TEXT_ROLES[role]
      if (!rule) {
        push('font_below_min', el, `Rol de texto desconocido: "${role}"`)
        continue
      }
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (size + 0.01 < rule.min) push('font_below_min', el, `${role}: ${size}px < mínimo ${rule.min}px`)
      if (!inside(rect)) push('outside_safe_area', el, `${role}: la caja sale del área segura`)
      if (el.dataset.fit === 'too_long') push('text_overflow', el, `${role}: el texto no cabe ni con ${size}px`)
      const color = toHex(parseColor(getComputedStyle(el).color))
      const backgrounds = effectiveBackground(el, canvasEl)
      const ratio = minContrastAgainst(color, backgrounds)
      if (ratio < MIN_CONTRAST) {
        push('low_contrast', el, `${role}: contraste ${ratio.toFixed(2)}:1 < ${MIN_CONTRAST}:1 sobre ${backgrounds.join(', ')}`)
      }
    }

    if (el.hasAttribute('data-logo')) {
      const max = el.hasAttribute('data-cover') ? LOGO_HEIGHT.coverMax : LOGO_HEIGHT.max
      if (rect.height + EPSILON < LOGO_HEIGHT.min || rect.height - EPSILON > max) {
        push('logo_size', el, `Logo de ${Math.round(rect.height)}px fuera de ${LOGO_HEIGHT.min}–${max}px`)
      }
      if (!inside(rect)) push('outside_safe_area', el, 'Logo fuera del área segura')
    }

    if (el.hasAttribute('data-icon')) {
      if (rect.width + EPSILON < ICON_MIN_PX || rect.height + EPSILON < ICON_MIN_PX) {
        push('icon_size', el, `Ícono de ${Math.round(rect.width)}×${Math.round(rect.height)}px < ${ICON_MIN_PX}px`)
      }
      if (!inside(rect)) push('outside_safe_area', el, 'Ícono fuera del área segura')
    }
  }
  return out
}

/** Paradas del fondo más cercano: `data-bg` o un `background-color` opaco; si no hay, blanco. */
function effectiveBackground(el: HTMLElement, canvasEl: HTMLElement): string[] {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const declared = node.dataset.bg
    if (declared) return declared.split(',').map((c) => c.trim())
    const bg = getComputedStyle(node).backgroundColor
    if (!isTransparent(bg)) return [toHex(parseColor(bg))]
    if (node === canvasEl) break
  }
  return ['#ffffff']
}

function isTransparent(cssColor: string): boolean {
  if (cssColor === 'transparent') return true
  const alpha = /^rgba\([^)]*,\s*([\d.]+)\s*\)$/.exec(cssColor)
  return alpha !== null && Number(alpha[1]) === 0
}
