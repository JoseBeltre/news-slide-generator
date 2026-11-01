// Fecha de la presentación en piezas y título de portada o cierre.
import { eventDateParts } from '../../../lib/format'
import { referenceDate, type SlideContext, type SlideSpec } from '../contract'

export const coverDate = (ctx: SlideContext) => {
  const iso = referenceDate(ctx)
  return { ...eventDateParts(iso, { reference: iso }), year: iso.slice(0, 4) }
}

export const CLOSING_TITLE = '¡Feliz sábado!'

/** El cierre repite la composición de la portada con el saludo en lugar del título: abre y cierra igual. */
export const frameTitle = (spec: Extract<SlideSpec, { kind: 'cover' | 'closing' }>, ctx: SlideContext) =>
  spec.kind === 'closing' ? CLOSING_TITLE : ctx.settings.coverTitle
