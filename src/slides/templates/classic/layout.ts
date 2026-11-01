// Geometría de la plantilla Clásica (§9): título arriba, datos con ícono en columna, logo en la esquina.
// Todo en px del lienzo y dentro del área segura; puro, para probarlo sin navegador.
import { SAFE_AREA, type Rect, type TextSlotDef } from '../../engine'
import type { InfoRow, NormalizedData } from '../../normalize'
import type { DecorationVariant } from '../parts/decoration'

export interface ClassicRowLayout {
  row: InfoRow
  slot: TextSlotDef
  /** Caja del chip; el ícono (64 px) va centrado dentro. */
  chip: Rect
}

export interface ClassicLayout {
  title?: TextSlotDef
  /** Banda de color detrás del título (variante "banda"). */
  titleBand?: Rect
  rows: ClassicRowLayout[]
  logo?: Rect
}

const LOGO: Rect = { x: 1424, y: 64, width: 400, height: 160 }
const ROW_GAP = 16
const CHIP_MAX = 112
// Con pocas filas no se estiran: se apilan desde arriba y el resto queda como espacio en blanco (§9).
const ROW_MAX = 128
const TEXT_GAP = 32

export function classicLayout(data: NormalizedData, opts: { hasLogo: boolean; variant: DecorationVariant }): ClassicLayout {
  const band = opts.variant === 'banda'
  const titleTop = SAFE_AREA.y
  const titleHeight = band ? 288 : 300
  const titleWidth = opts.hasLogo ? LOGO.x - SAFE_AREA.x - 32 : SAFE_AREA.width
  const rowsTop = band ? 448 : 412
  const rowsBottom = SAFE_AREA.y + SAFE_AREA.height
  const n = data.rows.length
  const rowHeight = n > 0 ? Math.min(ROW_MAX, (rowsBottom - rowsTop - ROW_GAP * (n - 1)) / n) : 0
  const chipHeight = Math.min(CHIP_MAX, rowHeight)
  const chipWidth = opts.variant === 'calida' ? Math.round(chipHeight * 1.5) : chipHeight

  return {
    title: data.title && {
      id: 'titulo',
      role: 'title',
      fieldKey: data.title.fieldKey,
      box: { x: SAFE_AREA.x, y: titleTop, width: titleWidth, height: titleHeight },
      maxLines: 2,
    },
    titleBand: band ? { x: 0, y: 0, width: 1920, height: titleTop + titleHeight + 32 } : undefined,
    logo: opts.hasLogo ? LOGO : undefined,
    rows: data.rows.map((row, i) => {
      const y = rowsTop + i * (rowHeight + ROW_GAP)
      // Una fila sin ícono no deja hueco: el texto empieza en el margen.
      const textX = row.icon ? SAFE_AREA.x + chipWidth + TEXT_GAP : SAFE_AREA.x
      return {
        row,
        chip: { x: SAFE_AREA.x, y: y + (rowHeight - chipHeight) / 2, width: chipWidth, height: chipHeight },
        slot: {
          id: `fila-${i}`,
          role: row.role,
          fieldKey: row.fieldKeys.at(-1),
          box: { x: textX, y, width: SAFE_AREA.x + SAFE_AREA.width - textX, height: rowHeight },
          maxLines: row.role === 'key' ? 1 : 2,
        },
      }
    }),
  }
}
