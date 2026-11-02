// Validación de los valores de un anuncio contra su tipo (RF-04), generada desde los FieldDef.
// Texto recortado; un opcional vacío desaparece; un obligatorio vacío dice "Este campo es obligatorio."
// y los demás mensajes son para valores presentes pero mal formados.
import { z } from 'zod'
import { parseLocalDate } from '../../lib/format'
import type { AnnouncementTypeDef, FieldDef } from './fields'

export const MESSAGES = Object.freeze({
  required: 'Este campo es obligatorio.',
  date: 'La fecha no es válida.',
  time: 'La hora no es válida.',
  money: 'El precio no puede ser negativo.',
  moneyNotNumber: 'Escribe el precio en números (por ejemplo, 500).',
  list: 'Agrega al menos un elemento.',
  choice: 'Elige una opción.',
  peopleEmpty: 'Agrega al menos una persona.',
  personName: 'Escribe el nombre.',
  personDayMonth: 'El día o el mes no es válido.',
  personDayInMonth: 'Ese día no existe en ese mes.',
})

export type Person = { name: string; day: number; month: number; photoId?: string }

export type ValidationResult =
  | { ok: true; values: Record<string, unknown> }
  | { ok: false; errors: Record<string, string> }

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/
// Días por mes sin año: febrero admite el 29 (los cumpleaños no guardan año, §3.3).
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** Mensaje según si el valor falta (`missing`) o está mal formado (`invalid`). */
const err = (missing: string, invalid: string) => ({
  error: (issue: { input?: unknown }) => (issue.input === undefined ? missing : invalid),
})

const isValidDate = (s: string) => {
  try {
    parseLocalDate(s)
    return true
  } catch {
    return false
  }
}

const person = z
  .object({
    name: z.string(err(MESSAGES.personName, MESSAGES.personName)).trim().min(1, MESSAGES.personName),
    day: z.number(err(MESSAGES.personDayMonth, MESSAGES.personDayMonth)).int(MESSAGES.personDayMonth).min(1, MESSAGES.personDayMonth).max(31, MESSAGES.personDayMonth),
    month: z.number(err(MESSAGES.personDayMonth, MESSAGES.personDayMonth)).int(MESSAGES.personDayMonth).min(1, MESSAGES.personDayMonth).max(12, MESSAGES.personDayMonth),
    // Quitar la foto deja '' o null: equivale a no tener foto.
    photoId: z.preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined), z.string().optional()),
  })
  // Zod 4 corre este refine aunque día o mes ya fallaran: solo se comprueba con ambos en rango.
  .refine((p) => {
    const max = DAYS_IN_MONTH[p.month - 1]
    return max === undefined || !Number.isInteger(p.day) || p.day < 1 || p.day <= max
  }, MESSAGES.personDayInMonth)

function kindSchema(field: FieldDef): z.ZodType {
  const req = MESSAGES.required
  switch (field.kind) {
    case 'text':
    case 'longtext':
    case 'image':
      return z.string(err(req, req))
    case 'date':
      return z.string(err(req, MESSAGES.date)).refine(isValidDate, MESSAGES.date)
    case 'time':
      return z.string(err(req, MESSAGES.time)).regex(HH_MM, MESSAGES.time)
    case 'money':
      return z.number(err(req, MESSAGES.moneyNotNumber)).min(0, MESSAGES.money)
    case 'list':
      return z.array(z.string(), err(MESSAGES.list, MESSAGES.list)).min(1, MESSAGES.list)
    case 'choice': {
      const values = (field.options ?? []).map((o) => o.value)
      return z.string(err(MESSAGES.choice, MESSAGES.choice)).refine((v) => values.includes(v), MESSAGES.choice)
    }
    case 'people':
      return z.array(person, err(MESSAGES.peopleEmpty, MESSAGES.peopleEmpty)).min(1, MESSAGES.peopleEmpty)
  }
}

/** Recorta textos, limpia listas, convierte lo vacío en ausente y aplica `defaultValue`. */
function normalize(field: FieldDef, value: unknown): unknown {
  let v = value
  if (typeof v === 'string') v = v.trim()
  if (field.kind === 'list' && Array.isArray(v)) {
    v = v.map((item) => (typeof item === 'string' ? item.trim() : item)).filter((item) => item !== '')
  }
  const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
  if (empty) return field.defaultValue
  return v
}

export function buildValuesSchema(typeDef: AnnouncementTypeDef): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodType> = {}
  for (const field of typeDef.fields) {
    const inner = kindSchema(field)
    // Un campo con valor por defecto no puede ser opcional: Zod 4 no pasa por preprocess una clave
    // opcional ausente, y el valor por defecto nunca se aplicaría.
    const optional = !field.required && field.defaultValue === undefined
    shape[field.key] = z.preprocess((v) => normalize(field, v), optional ? inner.optional() : inner)
  }
  // z.object descarta las claves que el tipo no declara.
  return z.object(shape) as unknown as z.ZodType<Record<string, unknown>>
}

export function validateValues(typeDef: AnnouncementTypeDef, values: Record<string, unknown>): ValidationResult {
  const result = buildValuesSchema(typeDef).safeParse(values)
  if (result.success) {
    const clean = Object.fromEntries(Object.entries(result.data).filter(([, v]) => v !== undefined))
    return { ok: true, values: clean }
  }
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    errors[path] ??= issue.message
  }
  return { ok: false, errors }
}
