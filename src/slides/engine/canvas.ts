import type { Rect } from './types'

// Lienzo lógico fijo 16:9 (C-06) y área segura contra el overscan de los televisores (§5.1).
export const CANVAS = { width: 1920, height: 1080 } as const

export const SAFE_AREA: Readonly<Rect> = Object.freeze({ x: 96, y: 64, width: 1728, height: 952 })

export interface CanvasScale {
  scale: number
  offsetX: number
  offsetY: number
}

/** Escala tipo "contain" del lienzo dentro de un contenedor, centrado. Un contenedor inválido da escala 0. */
export function computeScale(containerWidth: number, containerHeight: number): CanvasScale {
  const valid = (n: number) => Number.isFinite(n) && n > 0
  if (!valid(containerWidth) || !valid(containerHeight)) return { scale: 0, offsetX: 0, offsetY: 0 }

  const scale = Math.min(containerWidth / CANVAS.width, containerHeight / CANVAS.height)
  return {
    scale,
    offsetX: (containerWidth - CANVAS.width * scale) / 2,
    offsetY: (containerHeight - CANVAS.height * scale) / 2,
  }
}

/** true si el rectángulo cabe completo en el área segura (bordes inclusivos). */
export function isInsideSafeArea(rect: Rect): boolean {
  return (
    rect.x >= SAFE_AREA.x &&
    rect.y >= SAFE_AREA.y &&
    rect.x + rect.width <= SAFE_AREA.x + SAFE_AREA.width &&
    rect.y + rect.height <= SAFE_AREA.y + SAFE_AREA.height
  )
}
