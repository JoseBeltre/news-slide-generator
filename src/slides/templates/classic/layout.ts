// Geometría compartida de la plantilla Clásica: filas de datos apiladas desde abajo y el título
// en el espacio que queda arriba. Todo en px del lienzo y dentro del área segura; puro, se prueba sin navegador.
import { SAFE_AREA, TEXT_ROLES, type Rect, type TextSlotDef } from '../../engine'
import type { InfoRow, NormalizedData } from '../../normalize'

export const SAFE_RIGHT = SAFE_AREA.x + SAFE_AREA.width
export const SAFE_BOTTOM = SAFE_AREA.y + SAFE_AREA.height

/** Tamaño máximo y líneas por rol: los datos van cerca del mínimo para que manden la fecha y el título. */
const ROW = {
  key: { maxFontSize: 70, maxLines: 1 },
  secondary: { maxFontSize: 56, maxLines: 2 },
} as const
export const ROW_GAP = 14

// Ancho medio de un carácter de Atkinson Hyperlegible en em, redondeado hacia arriba: estima de más
// las líneas, así una caja nunca queda corta (lo que sobre es aire, nunca un "No cabe" falso).
const AVG_ADVANCE = 0.56

// Con una o dos filas, un texto secundario (el mensaje de un aviso) puede ocupar una línea más.
const maxLinesFor = (role: InfoRow['role'], rowCount: number) => (role === 'secondary' && rowCount <= 2 ? 3 : ROW[role].maxLines)

/**
 * Líneas que reserva la fila: una si el texto entra en una línea al tamaño máximo; si no, las que
 * pida al mínimo del rol, hasta su tope. Así una descripción corta no deja un hueco de dos líneas.
 */
export function rowLines(row: InfoRow, width: number, rowCount: number): number {
  const max = maxLinesFor(row.role, rowCount)
  const lines = row.text.split('\n')
  if (lines.length === 1 && row.text.length * AVG_ADVANCE * ROW[row.role].maxFontSize <= width) return 1
  const atMin = lines.reduce((n, l) => n + Math.max(1, Math.ceil((l.length * AVG_ADVANCE * TEXT_ROLES[row.role].min) / width)), 0)
  return Math.min(max, Math.max(1, atMin))
}

// La caja admite sus líneas al mínimo del rol y una línea al máximo.
const rowHeight = (role: InfoRow['role'], lines: number) =>
  Math.ceil(Math.max(ROW[role].maxFontSize, TEXT_ROLES[role].min * lines) * TEXT_ROLES[role].lineHeight)

export interface PlacedRow {
  row: InfoRow
  slot: TextSlotDef
  /** Marca o ícono a la izquierda, centrado en la primera línea. */
  marker: Rect
}

/** Filas que no van ya en el bloque de fecha. */
export function detailRows(data: NormalizedData): InfoRow[] {
  const when = data.when
  return when ? data.rows.filter((r) => r.fieldKeys[0] !== when.fieldKeys[0]) : data.rows
}

export interface StackOptions {
  x: number
  width: number
  bottom: number
  /** Lado del cuadro de la marca o ícono; 0 = sin marca. */
  marker: number
  markerGap: number
}

/** Apila las filas de abajo hacia arriba y devuelve dónde empieza la pila. */
export function stackRows(rows: readonly InfoRow[], opts: StackOptions): { rows: PlacedRow[]; top: number } {
  const textX = opts.marker > 0 ? opts.x + opts.marker + opts.markerGap : opts.x
  const placed: PlacedRow[] = []
  let y = opts.bottom
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]!
    const lines = rowLines(row, opts.x + opts.width - textX, rows.length)
    const height = rowHeight(row.role, lines)
    y -= height
    const firstLine = ROW[row.role].maxFontSize * TEXT_ROLES[row.role].lineHeight
    placed.unshift({
      row,
      marker: { x: opts.x, y: y + Math.max(0, (firstLine - opts.marker) / 2), width: opts.marker, height: opts.marker },
      slot: {
        id: `fila-${i}`,
        role: row.role,
        fieldKey: row.fieldKeys.at(-1),
        box: { x: textX, y, width: opts.x + opts.width - textX, height },
        maxLines: lines,
        maxFontSize: ROW[row.role].maxFontSize,
      },
    })
    if (i > 0) y -= ROW_GAP
  }
  return { rows: placed, top: y }
}

/** Título en la caja que quede: tantas líneas como quepan al mínimo, hasta 4. */
export function titleSlot(fieldKey: string, box: Rect, opts: { maxFontSize?: number; align?: 'left' | 'center' | 'right' } = {}): TextSlotDef {
  const lineAtMin = TEXT_ROLES.title.min * TEXT_ROLES.title.lineHeight
  return {
    id: 'titulo',
    role: 'title',
    fieldKey,
    box,
    maxLines: Math.min(4, Math.max(1, Math.floor(box.height / lineAtMin))),
    ...(opts.maxFontSize ? { maxFontSize: opts.maxFontSize } : {}),
    ...(opts.align ? { align: opts.align } : {}),
  }
}

/** Mes para el bloque de fecha; con año se abrevia para no salirse del bloque ("SEP 2027"). */
export const monthLabel = (when: { month: string; monthShort: string; year?: string }) =>
  when.year ? `${when.monthShort} ${when.year}` : when.month

/** Slot de una línea para una pieza de la fecha (día, mes, hora…). */
export function lineSlot(id: string, fieldKey: string | undefined, box: Rect, maxFontSize: number, opts: { uppercase?: boolean; align?: 'left' | 'center' | 'right' } = {}): TextSlotDef {
  return { id, role: 'key', fieldKey, box, maxLines: 1, maxFontSize, uppercase: opts.uppercase, align: opts.align }
}

/** Foto de la plantilla Visual: solo con `templateId: 'visual'` y una imagen cargada en el anuncio. */
export const visualPhoto = (spec: { templateId: 'clasica' | 'visual'; data: NormalizedData }): string | undefined =>
  spec.templateId === 'visual' ? spec.data.imageId : undefined
