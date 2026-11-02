// Geometría de las slides de cumpleaños de grupo: banderines y el mensaje arriba, tarjetas (hasta 6)
// o lista de 2 columnas (7–8) con el nombre como protagonista y el día discreto, y el indicador "(1/2)".
// Sin logo ni fotos (pedido del responsable). Puro, en px del lienzo y dentro del área segura.
import { SAFE_AREA, type Rect, type TextSlotDef } from '../../engine'

const SAFE_BOTTOM = SAFE_AREA.y + SAFE_AREA.height

export const GROUP = {
  bunting: { x: 0, y: 0, width: 1920, height: 70 },
  /** Mensaje como cabecera (rol clave: el nombre manda); deja libre la esquina del confeti. */
  heading: { left: { x: SAFE_AREA.x, y: 92, width: 1320, height: 150 }, center: { x: 460, y: 92, width: 1000, height: 150 } },
  cardsTop: 278,
  page: { x: SAFE_AREA.x + SAFE_AREA.width - 240, y: 966, width: 240, height: 42 },
} as const

const GAP = { tarjetas: { x: 48, y: 40 }, lista: { x: 72, y: 20 } }
const COLS = { tarjetas: 3, lista: 2 }
const ROWS = { tarjetas: 2, lista: 4 }
/** Alto máximo de una fila de la lista. */
const ROW_MAX = 168

export function headingSlot(align: 'left' | 'center'): TextSlotDef {
  return { id: 'mensaje', role: 'key', fieldKey: 'mensaje', box: GROUP.heading[align], maxLines: 2, maxFontSize: 120, align, valign: 'center' }
}

export function pageSlot(): TextSlotDef {
  return { id: 'pagina', role: 'meta', box: GROUP.page, maxLines: 1, maxFontSize: 36, align: 'right' }
}

/** Celdas del grupo; con menos personas la rejilla se encoge y queda centrada (la última fila también). */
export function groupCells(count: number, layout: 'tarjetas' | 'lista', paged: boolean): Rect[] {
  const area = { x: SAFE_AREA.x, y: GROUP.cardsTop, width: SAFE_AREA.width, height: (paged ? GROUP.page.y - 14 : SAFE_BOTTOM - 16) - GROUP.cardsTop }
  const gap = GAP[layout]
  const cols = Math.min(COLS[layout], count)
  const width = (area.width - gap.x * (cols - 1)) / cols
  const full = (area.height - gap.y * (ROWS[layout] - 1)) / ROWS[layout]
  const height = layout === 'lista' ? Math.min(ROW_MAX, full) : full
  const usedRows = Math.ceil(count / cols)
  const blockHeight = usedRows * height + (usedRows - 1) * gap.y
  const top = area.y + (area.height - blockHeight) / 2
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols)
    const inRow = Math.min(cols, count - row * cols)
    const left = area.x + (area.width - (inRow * width + (inRow - 1) * gap.x)) / 2
    return { x: Math.round(left + (i % cols) * (width + gap.x)), y: Math.round(top + row * (height + gap.y)), width: Math.floor(width), height: Math.floor(height) }
  })
}

export interface CellLayout {
  name: TextSlotDef
  day?: TextSlotDef
}

/**
 * Interior de una celda. Tarjeta: el nombre grande al centro y el día debajo, pequeño. Lista: el
 * nombre a la izquierda y el día a la derecha. Sin día, el nombre ocupa todo.
 */
export function cellLayout(cell: Rect, i: number, layout: 'tarjetas' | 'lista', withDay: boolean): CellLayout {
  const ids = { day: `dia-${i}`, name: `nombre-${i}` }
  if (layout === 'tarjetas') {
    const pad = 28
    const inner = { x: cell.x + pad, y: cell.y + pad, width: cell.width - pad * 2, height: cell.height - pad * 2 }
    const dayHeight = withDay ? 76 : 0
    return {
      name: { id: ids.name, role: 'birthdayNameGroup', fieldKey: 'personas', box: { ...inner, height: inner.height - dayHeight }, maxLines: 2, maxFontSize: 84, align: 'center', valign: 'center' },
      ...(withDay
        ? { day: { id: ids.day, role: 'key', fieldKey: 'personas', box: { ...inner, y: inner.y + inner.height - dayHeight, height: dayHeight }, maxLines: 1, maxFontSize: 60, align: 'center' } }
        : {}),
    }
  }
  const marker = 40
  const dayWidth = withDay ? 230 : 0
  const nameX = cell.x + marker
  return {
    name: {
      id: ids.name,
      role: 'birthdayNameGroup',
      fieldKey: 'personas',
      box: { x: nameX, y: cell.y, width: cell.x + cell.width - dayWidth - (withDay ? 24 : 0) - nameX, height: cell.height - 12 },
      maxLines: 2,
      maxFontSize: 76,
      valign: 'center',
    },
    ...(withDay
      ? { day: { id: ids.day, role: 'key', fieldKey: 'personas', box: { x: cell.x + cell.width - dayWidth, y: cell.y, width: dayWidth, height: cell.height - 12 }, maxLines: 1, maxFontSize: 60, align: 'right', valign: 'center' } }
      : {}),
  }
}
