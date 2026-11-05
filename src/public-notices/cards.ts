// Tarjetas de la página pública (P9, RF-70): el mismo texto que las slides (`normalizeAnnouncement`),
// con la fecha siempre larga y sin "hoy/mañana", porque la página guardada se lee días después.
// Un anuncio que no se puede dibujar se omite: nunca tumba la página.
import { formatEventDate, formatTime } from '../lib/format'
import { normalizeAnnouncement } from '../slides/normalize'
import { ANNOUNCEMENT_TYPES } from '../slides/types/definitions'
import type { AnnouncementTypeId } from '../slides/types/fields'
import type { LoadState, NoticeCard, PublicNotice, PublicNoticesData } from './types'

const NEVER_PUBLIC = new Set(['cumpleanos', 'imagen'])

export function noticeCards(data: PublicNoticesData): NoticeCard[] {
  const cards: NoticeCard[] = []
  for (const notice of data.notices) {
    const card = toCard(notice, data)
    if (card) cards.push({ ...card, number: cards.length + 1 })
  }
  return cards
}

function toCard(notice: PublicNotice, data: PublicNoticesData): Omit<NoticeCard, 'number'> | null {
  const def = ANNOUNCEMENT_TYPES.find((t) => t.id === notice.typeId)
  if (!def || NEVER_PUBLIC.has(def.id)) return null
  try {
    const { timeFormat, currency } = data.settings
    const normalized = normalizeAnnouncement(def.id as AnnouncementTypeId, notice.values, {
      today: data.today,
      reference: data.today,
      dateStyle: 'largo',
      relativeDates: false,
      timeFormat,
      currency,
    })
    const rows = normalized.rows.flatMap((row) => {
      // La fecha principal y su hora vienen juntas ("Sábado 7 · 7:00 p. m."): aquí van en dos filas.
      if (row.fieldKeys.length !== 2 || !normalized.when) return [{ icon: row.icon, text: row.text }]
      const [dateKey, timeKey] = row.fieldKeys as [string, string]
      const timeIcon = def.fields.find((f) => f.key === timeKey)?.icon
      return [
        { icon: row.icon, text: formatEventDate(String(notice.values[dateKey]), { style: 'largo', reference: data.today }) },
        { icon: timeIcon, text: formatTime(String(notice.values[timeKey]), { timeFormat }) },
      ]
    })
    return {
      id: notice.id,
      typeId: def.id,
      typeName: def.name.split(' / ')[0]!,
      title: normalized.title?.text || def.name,
      rows,
    }
  } catch {
    return null
  }
}

const WHEN = new Intl.DateTimeFormat('es-DO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Santo_Domingo',
})

export function stateLabel(state: LoadState): string | null {
  if (state.kind === 'fresh') return `Actualizado el ${WHEN.format(new Date(state.savedAt))}`
  if (state.kind === 'cached') return `Sin conexión · guardado el ${WHEN.format(new Date(state.savedAt))}`
  return null
}
