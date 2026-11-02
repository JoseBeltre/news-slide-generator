// Cumpleaños: reparto en slides según el modo (RF-21), en orden de cercanía a la fecha de la
// presentación (RF-26) y con "(1/2)" cuando un grupo no cabe en una slide (RF-25). Puro.
import { formatDayMonth, parseLocalDate } from '../../../lib/format'
import type { Person } from '../../types/validation'
import type { SlideSpec } from '../contract'

export type BirthdayMode = 'individual' | 'grupo' | 'hibrido'

export interface BirthdayValues {
  modo?: BirthdayMode
  personas: readonly Person[]
  mensaje?: string
  versiculo?: string
}

type Framing = 'logo' | 'palette' | 'slideStyle'
export type BirthdayPage =
  | Omit<Extract<SlideSpec, { kind: 'birthday-single' }>, Framing>
  | Omit<Extract<SlideSpec, { kind: 'birthday-group' }>, Framing>

/** Personas por slide de grupo: 3×2 si alguien tiene foto, 2×4 si solo hay nombres (RF-25). */
export const GROUP_CAPACITY = { photos: 6, names: 8 } as const

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

/** Grupos que llenan cada slide hasta su capacidad (6 si alguien de esa slide tiene foto, 8 si no). */
function chunkGroup(people: readonly Person[]): Person[][] {
  const pages: Person[][] = []
  let page: Person[] = []
  for (const person of people) {
    const next = [...page, person]
    const capacity = next.some((x) => x.photoId) ? GROUP_CAPACITY.photos : GROUP_CAPACITY.names
    if (next.length > capacity) {
      pages.push(page)
      page = [person]
    } else page = next
  }
  if (page.length) pages.push(page)
  return pages
}

export function birthdayLayout(values: BirthdayValues, ctx: { referenceDate: string; defaultMessage: string }): BirthdayPage[] {
  const message = values.mensaje?.trim() || ctx.defaultMessage
  const verse = values.versiculo?.trim() || undefined
  const sorted = values.personas
    .map((person, i) => ({ person, i, d: daysFromReference(person, ctx.referenceDate) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((x) => x.person)
  const single = (person: Person): BirthdayPage => ({
    kind: 'birthday-single',
    person,
    dayText: formatDayMonth(person.day, person.month),
    message,
    ...(verse ? { verse } : {}),
  })
  const groups = (people: readonly Person[]): BirthdayPage[] => {
    const pages = chunkGroup(people)
    return pages.map((page, i) => ({
      kind: 'birthday-group',
      people: page.map((person) => ({ ...person, dayText: formatDayMonth(person.day, person.month) })),
      message,
      ...(pages.length > 1 ? { page: [i + 1, pages.length] as [number, number] } : {}),
    }))
  }

  const mode = values.modo ?? 'individual'
  if (mode === 'individual') return sorted.map(single)
  if (mode === 'grupo') return groups(sorted)
  return [...sorted.filter((x) => x.photoId).map(single), ...groups(sorted.filter((x) => !x.photoId))]
}
