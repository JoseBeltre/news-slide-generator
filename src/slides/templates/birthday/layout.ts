// Cumpleaños: reparto en slides según el modo (RF-21), en orden de cercanía a la fecha de la
// presentación (RF-26) y con "(1/2)" cuando un grupo no cabe en una slide (RF-25). Las listas no
// llevan fotos y el día se puede ocultar; el mismo día de la presentación nunca se muestra. Puro.
import { formatDayMonth, parseLocalDate } from '../../../lib/format'
import type { Person } from '../../types/validation'
import type { SlideSpec } from '../contract'

export type BirthdayMode = 'individual' | 'grupo' | 'hibrido'

export interface BirthdayValues {
  modo?: BirthdayMode
  personas: readonly Person[]
  mensaje?: string
  versiculo?: string
  mostrarDia?: 'si' | 'no'
}

type Framing = 'logo' | 'palette' | 'slideStyle'
export type BirthdayPage =
  | Omit<Extract<SlideSpec, { kind: 'birthday-single' }>, Framing>
  | Omit<Extract<SlideSpec, { kind: 'birthday-group' }>, Framing>

/** Personas por slide de grupo: tarjetas 3 × 2 hasta 6; si son más, listas de 2 × 4 (RF-25). */
export const GROUP_CAPACITY = { cards: 6, list: 8 } as const

const DAY_MS = 86_400_000

/**
 * Días entre la presentación y el cumpleaños más cercano (antes o después): el 30 de diciembre
 * va antes que el 1 de enero en la semana de año nuevo.
 */
export function daysFromReference(person: Pick<Person, 'day' | 'month'>, referenceDate: string): number {
  const ref = parseLocalDate(referenceDate)
  const year = ref.getFullYear()
  const offsets = [year - 1, year, year + 1].map((y) => Math.round((new Date(y, person.month - 1, person.day).getTime() - ref.getTime()) / DAY_MS))
  return offsets.reduce((best, d) => (Math.abs(d) < Math.abs(best) ? d : best))
}

export function birthdayLayout(values: BirthdayValues, ctx: { referenceDate: string; defaultMessage: string }): BirthdayPage[] {
  const message = values.mensaje?.trim() || ctx.defaultMessage
  const verse = values.versiculo?.trim() || undefined
  const sorted = values.personas
    .map((person, i) => ({ person, i, d: daysFromReference(person, ctx.referenceDate) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
  // El día se oculta si así se pidió o si el cumpleaños es el mismo día de la presentación.
  const dayText = (x: { person: Person; d: number }) =>
    values.mostrarDia === 'no' || x.d === 0 ? {} : { dayText: formatDayMonth(x.person.day, x.person.month) }
  const single = (x: { person: Person; d: number }): BirthdayPage => ({
    kind: 'birthday-single',
    person: x.person,
    ...dayText(x),
    message,
    ...(verse ? { verse } : {}),
  })
  const groups = (people: typeof sorted): BirthdayPage[] => {
    if (!people.length) return []
    const layout = people.length <= GROUP_CAPACITY.cards ? 'tarjetas' : 'lista'
    const size = layout === 'tarjetas' ? GROUP_CAPACITY.cards : GROUP_CAPACITY.list
    const pages = Array.from({ length: Math.ceil(people.length / size) }, (_, i) => people.slice(i * size, (i + 1) * size))
    return pages.map((page, i) => ({
      kind: 'birthday-group',
      // Las listas no llevan fotos.
      people: page.map((x) => ({ name: x.person.name, day: x.person.day, month: x.person.month, ...dayText(x) })),
      layout,
      message,
      ...(pages.length > 1 ? { page: [i + 1, pages.length] as [number, number] } : {}),
    }))
  }

  const mode = values.modo ?? 'individual'
  if (mode === 'individual') return sorted.map(single)
  if (mode === 'grupo') return groups(sorted)
  return [...sorted.filter((x) => x.person.photoId).map(single), ...groups(sorted.filter((x) => !x.person.photoId))]
}
