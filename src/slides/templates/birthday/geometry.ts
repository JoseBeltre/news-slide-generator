// Geometría de las slides de cumpleaños de grupo: cabecera con el mensaje y el logo, rejilla de
// tarjetas del mismo tamaño y el indicador "(1/2)". Puro, en px del lienzo y dentro del área segura.
import { SAFE_AREA, type Rect, type TextSlotDef } from '../../engine'

const SAFE_RIGHT = SAFE_AREA.x + SAFE_AREA.width
const SAFE_BOTTOM = SAFE_AREA.y + SAFE_AREA.height

export const GROUP = {
  /** Mensaje como cabecera (rol clave: el nombre manda). */
  heading: { x: SAFE_AREA.x, y: 72, width: 1280, height: 150 },
  logo: { x: 1424, y: 84, width: SAFE_RIGHT - 1424, height: 126 },
  cardsTop: 246,
  page: { x: SAFE_RIGHT - 240, y: 966, width: 240, height: 42 },
} as const

const GAP = { photos: { x: 40, y: 32 }, names: { x: 48, y: 16 } }
/** Alto máximo de una tarjeta de solo nombres: con pocas personas no se estiran sin fin. */
const NAME_CARD_MAX = 200
/** Entre el bloque del día y el nombre de una tarjeta de solo nombres (el filete va en medio). */
export const NAME_GAP = 44

export function headingSlot(): TextSlotDef {
  return { id: 'mensaje', role: 'key', fieldKey: 'mensaje', box: GROUP.heading, maxLines: 2, maxFontSize: 120 }
}

export function pageSlot(): TextSlotDef {
  return { id: 'pagina', role: 'meta', box: GROUP.page, maxLines: 1, maxFontSize: 36, align: 'right' }
}

/**
 * Tarjetas del grupo: 3 columnas × 2 filas si alguien tiene foto, 2 × 4 si solo hay nombres
 * (RF-25). Con menos personas, la rejilla se ajusta y queda centrada en su zona.
 */
export function groupCards(count: number, withPhotos: boolean, paged: boolean): Rect[] {
  const area = { x: SAFE_AREA.x, y: GROUP.cardsTop, width: SAFE_AREA.width, height: (paged ? GROUP.page.y - 14 : SAFE_BOTTOM - 16) - GROUP.cardsTop }
  const gap = withPhotos ? GAP.photos : GAP.names
  const cols = withPhotos ? Math.min(3, count) : count <= 3 ? 1 : 2
  const rows = withPhotos ? 2 : 4
  const width = (area.width - gap.x * (cols - 1)) / cols
  const fullHeight = (area.height - gap.y * (rows - 1)) / rows
  const height = withPhotos ? fullHeight : Math.min(NAME_CARD_MAX, fullHeight)
  const usedRows = Math.ceil(count / cols)
  const blockHeight = usedRows * height + (usedRows - 1) * gap.y
  const top = area.y + (area.height - blockHeight) / 2
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols)
    // La última fila incompleta queda centrada.
    const inRow = Math.min(cols, count - row * cols)
    const left = area.x + (area.width - (inRow * width + (inRow - 1) * gap.x)) / 2
    return { x: Math.round(left + (i % cols) * (width + gap.x)), y: Math.round(top + row * (height + gap.y)), width: Math.floor(width), height: Math.floor(height) }
  })
}

export interface CardLayout {
  photo?: Rect
  day: TextSlotDef
  name: TextSlotDef
}

/**
 * Interior de una tarjeta. Con fotos: foto redonda y la fecha al lado, el nombre debajo; sin foto
 * en esa rejilla, la fecha arriba y el nombre más grande. Solo nombres: la fecha a la izquierda.
 */
export function cardLayout(card: Rect, i: number, mode: 'photos' | 'names', hasPhoto: boolean): CardLayout {
  const pad = mode === 'photos' ? 22 : 26
  const inner = { x: card.x + pad, y: card.y + (mode === 'photos' ? 16 : 0), width: card.width - pad * 2, height: card.height - (mode === 'photos' ? 32 : 0) }
  const ids = { day: `dia-${i}`, name: `nombre-${i}` }
  if (mode === 'names') {
    const dayWidth = 280
    return {
      day: { id: ids.day, role: 'key', fieldKey: 'personas', box: { ...inner, width: dayWidth }, maxLines: 1, maxFontSize: 76, uppercase: true, align: 'center', valign: 'center' },
      name: { id: ids.name, role: 'birthdayNameGroup', fieldKey: 'personas', box: { ...inner, x: inner.x + dayWidth + NAME_GAP, width: inner.width - dayWidth - NAME_GAP }, maxLines: 2, maxFontSize: 76, valign: 'center' },
    }
  }
  const top = 144
  const nameBox = { x: inner.x, y: inner.y + top + 12, width: inner.width, height: inner.height - top - 12 }
  if (!hasPhoto) {
    return {
      day: { id: ids.day, role: 'key', fieldKey: 'personas', box: { ...inner, height: top }, maxLines: 1, maxFontSize: 110, uppercase: true, align: 'center', valign: 'center' },
      name: { id: ids.name, role: 'birthdayNameGroup', fieldKey: 'personas', box: nameBox, maxLines: 2, maxFontSize: 84, valign: 'center' },
    }
  }
  return {
    photo: { x: inner.x, y: inner.y, width: top, height: top },
    day: { id: ids.day, role: 'key', fieldKey: 'personas', box: { x: inner.x + top + 24, y: inner.y, width: inner.width - top - 24, height: top }, maxLines: 1, maxFontSize: 96, uppercase: true, align: 'center', valign: 'center' },
    name: { id: ids.name, role: 'birthdayNameGroup', fieldKey: 'personas', box: nameBox, maxLines: 2, maxFontSize: 76, valign: 'center' },
  }
}
