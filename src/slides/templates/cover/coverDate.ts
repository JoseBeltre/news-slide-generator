// Fecha de la presentación en piezas, para las portadas.
import { eventDateParts } from '../../../lib/format'
import { referenceDate, type SlideContext } from '../contract'

export const coverDate = (ctx: SlideContext) => {
  const iso = referenceDate(ctx)
  return { ...eventDateParts(iso, { reference: iso }), year: iso.slice(0, 4) }
}
