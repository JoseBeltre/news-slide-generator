// Medidas y colores compartidos por las piezas de cada estilo (anuncios y portada).
import type { Rect } from '../../engine'
import { mixColors, type SlidePalette } from '../../themes'

/** Almanaque: color de la costura, las grapas y el picado, sobre la hoja. Decoración. */
export const sheetSeam = (p: SlidePalette) => mixColors(p.field, p.onField, 0.35)

/** Himnario: opacidad del tejido de la tapa (el texto encima lo declara en su data-bg). */
export const CLOTH_OPACITY = 0.07

/** Cartel: el campo de color baja en diagonal de x = 1296 (arriba) a x = 1116 (abajo). */
export const CARTEL = {
  field: '1296,0 1920,0 1920,1080 1116,1080',
  halftone: '1164,0 1296,0 1116,1080 984,1080',
  stripe: '1120,0 1140,0 960,1080 940,1080',
  /** Columna de la fecha dentro del campo. */
  date: { x: 1340, width: 1824 - 1340 },
} as const

export type SheetGeometry = Rect & { headerBottom: number }
