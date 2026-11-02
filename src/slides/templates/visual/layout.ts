// Plantilla Visual (afiche con la foto de quien predica o del invitado especial): geometría común a
// los 3 estilos. La foto recortada va de pie en un "escenario" a la derecha; a la izquierda, debajo del
// bloque de fecha, el título, el nombre de la persona destacado y los demás datos. Puro.
import type { Rect, TextSlotDef } from '../../engine'
import type { InfoRow, NormalizedData } from '../../normalize'
import { detailRows, stackRows, titleSlot, type PlacedRow } from '../classic/layout'

/** Logos arriba a la derecha, sobre el escenario; la foto empieza debajo. */
export const VISUAL_LOGO = { x: 1424, y: 80, width: 400, height: 110 } as const
export const PHOTO_TOP = 214

const PERSON = { maxFontSize: 96, minFontSize: 60, lineHeight: 1.2 }
// Igual que classic/layout: estima de más el ancho de un carácter.
const AVG_ADVANCE = 0.56
const GAP = { person: 36, title: 28 }

export interface VisualColumn {
  title?: { slot: TextSlotDef; text: string }
  person?: { slot: TextSlotDef; text: string; marker: Rect }
  rows: PlacedRow[]
}

export interface VisualColumnOptions {
  x: number
  width: number
  top: number
  bottom: number
  marker: number
  markerGap: number
  titleMax: number
}

/**
 * Columna de texto: las filas apiladas desde abajo, encima el nombre de la persona de la foto
 * (rol clave, más grande que las filas, con su marca) y arriba el título en el espacio que quede.
 */
export function visualColumn(data: NormalizedData, o: VisualColumnOptions): VisualColumn {
  const rows = detailRows(data)
  const personRow: InfoRow | undefined = data.imageCaptionKey ? rows.find((r) => r.fieldKeys.includes(data.imageCaptionKey!)) : undefined
  const stack = stackRows(
    rows.filter((r) => r !== personRow),
    o,
  )
  let y = stack.rows.length ? stack.top - GAP.person : o.bottom

  let person: VisualColumn['person']
  if (personRow) {
    const textX = o.x + o.marker + o.markerGap
    const width = o.x + o.width - textX
    const lines = personRow.text.length * AVG_ADVANCE * PERSON.maxFontSize <= width ? 1 : 2
    const height = Math.ceil(lines === 1 ? PERSON.maxFontSize * PERSON.lineHeight : PERSON.minFontSize * PERSON.lineHeight * 2)
    y -= height
    person = {
      text: personRow.text,
      slot: { id: 'persona', role: 'key', fieldKey: personRow.fieldKeys.at(-1), box: { x: textX, y, width, height }, maxLines: lines, maxFontSize: PERSON.maxFontSize, valign: 'center' },
      marker: { x: o.x, y: y + (height - o.marker) / 2, width: o.marker, height: o.marker },
    }
    y -= GAP.title
  }

  const title = data.title && {
    slot: { ...titleSlot(data.title.fieldKey, { x: o.x, y: o.top, width: o.width, height: Math.max(1, y - o.top) }, { maxFontSize: o.titleMax }), valign: 'bottom' as const },
    text: data.title.text,
  }
  return { title, person, rows: stack.rows }
}

/** La Visual con foto: solo con `templateId: 'visual'` y una imagen cargada en el anuncio. */
export const hasVisualPhoto = (spec: { templateId: 'clasica' | 'visual'; data: NormalizedData }) => spec.templateId === 'visual' && !!spec.data.imageId
