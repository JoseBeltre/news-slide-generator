// Reglas de los anuncios para la interfaz (RF-02, RF-07, RF-08): funciones puras, sin base de datos.
import type { SlideStatus } from '../slides/templates/contract'
import type { AnnouncementTypeId } from '../slides/types/fields'
import { getTypeDef } from '../slides/types/definitions'
import type { Person } from '../slides/types/validation'
import type { NewRecord } from './local/repository'
import type { Announcement, Settings } from './models'

export type AnnouncementView = 'activos' | 'pasados'

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/** Fecha principal del anuncio ('fecha' del tipo), para archivar y ordenar. Los cumpleaños no tienen. */
export function eventDateOf(typeId: string, values: Record<string, unknown>): string | undefined {
  const hasDate = getTypeDef(typeId).fields.some((f) => f.key === 'fecha' && f.kind === 'date')
  return hasDate && nonEmpty(values.fecha) ? values.fecha : undefined
}

/** Pasado = su fecha es anterior a hoy. Uno de hoy sigue activo; uno sin fecha nunca pasa. */
export function isPast(a: Pick<Announcement, 'eventDate'>, today: string): boolean {
  return a.eventDate !== undefined && a.eventDate < today
}

export function filterAnnouncements(
  list: Announcement[],
  f: { view: AnnouncementView; typeId?: string; today: string },
): Announcement[] {
  const wantPast = f.view === 'pasados'
  const byDate = (a: Announcement, b: Announcement) => {
    if (a.eventDate === b.eventDate) return 0
    if (a.eventDate === undefined) return 1
    if (b.eventDate === undefined) return -1
    return (a.eventDate < b.eventDate ? -1 : 1) * (wantPast ? -1 : 1)
  }
  return list
    .filter((a) => isPast(a, f.today) === wantPast && (!f.typeId || a.typeId === f.typeId))
    .sort(byDate)
}

/**
 * Anuncio nuevo de un tipo: valores por defecto de sus campos (el mensaje de cumpleaños, el de
 * Configuración), su plantilla y el logo de la iglesia. Sin `slideStyle` ni formato de fecha: sigue
 * a Configuración hasta que se elija otro.
 */
export function draftFrom(typeId: AnnouncementTypeId, settings: Settings): NewRecord<Announcement> {
  const def = getTypeDef(typeId)
  const values = Object.fromEntries(
    def.fields.filter((f) => f.defaultValue !== undefined).map((f) => [f.key, structuredClone(f.defaultValue)]),
  )
  if (typeId === 'cumpleanos') values.mensaje = settings.birthdayDefaultMessage
  return {
    typeId,
    templateId: def.defaultTemplateId,
    logo: { kind: 'iglesia' },
    values,
    imageIds: [],
    status: 'borrador',
    createdAt: new Date().toISOString(),
  }
}

/** Copia para reutilizar (RF-02): otro registro, en borrador, con sus propios valores. */
export function duplicate(a: Announcement, now: string): NewRecord<Announcement> {
  const { id: _id, updatedAt: _u, deletedAt: _d, ...rest } = structuredClone(a)
  return { ...rest, status: 'borrador', createdAt: now }
}

/** Estado guardado: un anuncio que no valida es borrador; uno válido, listo o "no cabe" según la slide. */
export function statusFor(valid: boolean, slide: SlideStatus['status']): Announcement['status'] {
  if (!valid) return 'borrador'
  if (slide === 'midiendo') throw new Error('La slide todavía se está midiendo: espera antes de decidir el estado.')
  return slide === 'no_cabe' ? 'no_cabe' : 'listo'
}

/** Nombre para listas: el título, el título interno o los nombres del cumpleaños. */
export function displayTitle(a: Pick<Announcement, 'typeId' | 'values'>): string | undefined {
  const { titulo, tituloInterno, personas } = a.values
  if (nonEmpty(titulo)) return titulo.trim()
  if (nonEmpty(tituloInterno)) return tituloInterno.trim()
  if (Array.isArray(personas)) {
    const names = (personas as Person[]).map((p) => p?.name?.trim()).filter(nonEmpty)
    if (names.length) return `Cumpleaños: ${names.join(', ')}`
  }
  return undefined
}
