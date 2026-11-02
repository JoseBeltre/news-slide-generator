// Anuncio → datos listos para dibujar (§3.2, §5.4): texto ya formateado en es-DO, una fila por dato
// con su ícono y la comprobación de densidad. Genérico sobre los FieldDef: nada de código por tipo (RNF-08).
import { eventDateParts, formatEventDate, formatMoney, formatTime, type DateStyle, type EventDateParts } from '../lib/format'
import { checkDensity, countWords } from './engine'
import { getTypeDef } from './types/definitions'
import { isMainDate, type AnnouncementTypeId, type FieldDef } from './types/fields'

export interface InfoRow {
  fieldKeys: string[]
  icon?: string
  text: string
  role: 'key' | 'secondary'
}

export type DensityStatus =
  | { status: 'ok' }
  | { status: 'no_cabe'; code: 'too_many_lines' | 'too_many_words'; fieldKey: string }

/** Fecha principal en piezas (y su hora), para plantillas que la dibujan como elemento protagonista. */
export interface EventWhen extends EventDateParts {
  /** Los mismos campos que su fila en `rows`; la plantilla que dibuja el bloque omite esa fila. */
  fieldKeys: string[]
  time?: string
}

export interface NormalizedData {
  typeId: AnnouncementTypeId
  title?: { fieldKey: string; text: string }
  rows: InfoRow[]
  when?: EventWhen
  imageFieldKey?: string
  imageId?: string
  /** Campo que nombra a la persona de la foto (FieldDef.captionField). */
  imageCaptionKey?: string
  density: DensityStatus
}

export interface NormalizeContext {
  today: string
  /** Fecha de la presentación (o hoy): base de las fechas relativas y de "otro mes / otro año". */
  reference: string
  dateStyle?: DateStyle
  relativeDates?: boolean
  timeFormat?: '12h' | '24h'
  currency?: string
}

const SEPARATOR = ' · '

const isFilled = (v: unknown) =>
  v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '') && !(Array.isArray(v) && v.length === 0)

const upper = (s: string) => s.toLocaleUpperCase('es-DO')
const lowerFirst = (s: string) => s.charAt(0).toLocaleLowerCase('es-DO') + s.slice(1)

export function normalizeAnnouncement(
  typeId: AnnouncementTypeId,
  values: Record<string, unknown>,
  ctx: NormalizeContext,
): NormalizedData {
  if (typeId === 'cumpleanos' || typeId === 'imagen') {
    throw new Error(`El tipo "${typeId}" tiene su propio layout; no pasa por normalizeAnnouncement`)
  }
  const def = getTypeDef(typeId)
  const style = ctx.dateStyle ?? 'largo'
  const uppercase = style !== 'largo'
  const time = (hhmm: string) => {
    const t = formatTime(hhmm, { timeFormat: ctx.timeFormat })
    return uppercase ? upper(t) : t
  }
  const filled = def.fields.filter((f) => isFilled(values[f.key]))
  // La fecha principal se une con la primera hora del tipo en una sola fila.
  const mainDate = filled.find(isMainDate)
  const mainTime = mainDate ? filled.find((f) => f.kind === 'time') : undefined

  const out: NormalizedData = { typeId, rows: [], density: { status: 'ok' } }
  for (const field of filled) {
    const value = values[field.key]
    if (field.kind === 'image') {
      if (!out.imageId) Object.assign(out, { imageFieldKey: field.key, imageId: String(value), ...(field.captionField ? { imageCaptionKey: field.captionField } : {}) })
      continue
    }
    if (!field.role || field.role === 'presenter-only' || field === mainTime) continue
    if (field.role === 'title') {
      if (!out.title) out.title = { fieldKey: field.key, text: String(value).trim() }
      continue
    }
    const row = rowFor(field, value)
    if (row) out.rows.push({ ...row, role: field.role })
  }
  out.density = density(out.rows, def.fields)
  return out

  function rowFor(field: FieldDef, value: unknown): Omit<InfoRow, 'role'> | null {
    switch (field.kind) {
      case 'date': {
        if (field === mainDate) {
          const timeValue = mainTime ? String(values[mainTime.key]) : undefined
          const date = formatEventDate(String(value), {
            style,
            relative: ctx.relativeDates,
            reference: ctx.reference,
            time: timeValue,
          })
          const text = timeValue ? date + SEPARATOR + time(timeValue) : date
          const fieldKeys = mainTime ? [field.key, mainTime.key] : [field.key]
          out.when = {
            fieldKeys,
            ...eventDateParts(String(value), { relative: ctx.relativeDates, reference: ctx.reference, time: timeValue }),
            ...(timeValue ? { time: formatTime(timeValue, { timeFormat: ctx.timeFormat }) } : {}),
          }
          return { fieldKeys, icon: field.icon, text }
        }
        const date = formatEventDate(String(value), { style, reference: ctx.reference })
        return { fieldKeys: [field.key], icon: field.icon, text: withPrefix(field, uppercase ? date : lowerFirst(date)) }
      }
      case 'time':
        return { fieldKeys: [field.key], icon: field.icon, text: withPrefix(field, time(String(value))) }
      case 'money':
        return { fieldKeys: [field.key], icon: field.icon, text: withPrefix(field, formatMoney(Number(value), { currency: ctx.currency })) }
      case 'list':
        return {
          fieldKeys: [field.key],
          icon: field.icon,
          text: withPrefix(field, (value as string[]).map((s) => s.trim()).filter(Boolean).join(', ')),
        }
      case 'text':
      case 'longtext':
        return { fieldKeys: [field.key], icon: field.icon, text: withPrefix(field, String(value).trim()) }
      default:
        return null
    }
  }

  function withPrefix(field: FieldDef, text: string): string {
    if (!field.slidePrefix) return text
    return `${uppercase ? upper(field.slidePrefix) : field.slidePrefix} ${text}`
  }
}

/** §5.4: el culpable es el último campo que se pasa del límite (líneas) o el texto corrido más largo. */
function density(rows: readonly InfoRow[], fields: readonly FieldDef[]): DensityStatus {
  const longtext = new Set(fields.filter((f) => f.kind === 'longtext').map((f) => f.key))
  const running = rows.filter((r) => longtext.has(r.fieldKeys[0]!))
  const violations = checkDensity({ infoLines: rows.length, runningText: running.map((r) => r.text) })
  const lines = violations.find((v) => v.code === 'too_many_lines')
  if (lines) return { status: 'no_cabe', code: 'too_many_lines', fieldKey: rows.at(-1)!.fieldKeys.at(-1)! }
  if (violations.some((v) => v.code === 'too_many_words')) {
    const longest = running.reduce((a, b) => (countWords(b.text) > countWords(a.text) ? b : a))
    return { status: 'no_cabe', code: 'too_many_words', fieldKey: longest.fieldKeys[0]! }
  }
  return { status: 'ok' }
}
