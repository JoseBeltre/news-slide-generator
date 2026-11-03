// Reglas de las presentaciones (RF-50…RF-55), puras: fecha por defecto, sugerencias, orden,
// slides resultantes y problemas de contenido. Las pantallas y la comprobación sin internet las usan.
import { parseLocalDate, toIsoDate } from '../lib/format'
import type { SlideContext, SlideSpec, SlideStatus } from '../slides/templates/contract'
import { buildSlides, frameSlide } from '../slides/templates/registry'
import { displayTitle } from './announcements'
import type { NewRecord } from './local/repository'
import type { Announcement, Presentation } from './models'

const SATURDAY = 6

/** Una slide de la presentación; sin `announcementId`, es la portada o el cierre. */
export type PresentationSlide = { spec: SlideSpec; announcementId?: string }

export type ContentIssue =
  | { kind: 'vacia' }
  | { kind: 'eliminado'; index: number }
  | { kind: 'borrador' | 'no_cabe' | 'midiendo'; announcementId: string; title: string }

/** El próximo sábado (RF-50); hoy, si hoy es sábado. */
export function nextSaturday(today: string): string {
  const date = parseLocalDate(today)
  date.setDate(date.getDate() + ((SATURDAY - date.getDay() + 7) % 7))
  return toIsoDate(date)
}

/** Anuncios listos, no borrados, con fecha de evento ≥ la de la presentación, por fecha (RF-52). */
export function suggestedItems(date: string, list: readonly Announcement[]): Presentation['items'] {
  return list
    .filter((a) => !a.deletedAt && a.status === 'listo' && a.eventDate !== undefined && a.eventDate >= date)
    .sort((a, b) => a.eventDate!.localeCompare(b.eventDate!))
    .map((a) => ({ announcementId: a.id }))
}

export function newPresentation(date: string, list: readonly Announcement[]): NewRecord<Presentation> {
  return { date, items: suggestedItems(date, list), showCover: true, showClosing: true, published: false }
}

/** Copia con el elemento `from` en la posición `to`; con índices fuera de rango, igual. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const copy = [...items]
  const inRange = (i: number) => i >= 0 && i < items.length
  if (!inRange(from) || !inRange(to)) return copy
  copy.splice(to, 0, ...copy.splice(from, 1))
  return copy
}

/** Contexto de las slides de la presentación: su fecha y su título de portada (vacío → Configuración). */
export function presentationContext(p: Presentation, ctx: SlideContext): SlideContext {
  const coverTitle = p.coverTitle?.trim() || ctx.settings.coverTitle
  return { ...ctx, presentationDate: p.date, settings: { ...ctx.settings, coverTitle } }
}

const liveAnnouncement = (byId: ReadonlyMap<string, Announcement>, id: string) => {
  const a = byId.get(id)
  return a && !a.deletedAt ? a : undefined
}

/** Todas las slides en orden de proyección: [portada] + las de cada anuncio + [cierre]. */
export function presentationSlides(
  p: Presentation,
  byId: ReadonlyMap<string, Announcement>,
  ctx: SlideContext,
): PresentationSlide[] {
  const c = presentationContext(p, ctx)
  const body = p.items.flatMap(({ announcementId }) => {
    const a = liveAnnouncement(byId, announcementId)
    return a ? buildSlides(a, c).map((spec) => ({ spec, announcementId })) : []
  })
  const frame = (kind: 'cover' | 'closing') => ({ spec: frameSlide(kind, c, p.slideStyle) })
  return [...(p.showCover ? [frame('cover')] : []), ...body, ...(p.showClosing ? [frame('closing')] : [])]
}

/**
 * Lo que impide presentar: lista vacía, anuncios eliminados, incompletos o que no caben (guardado o
 * medido). Con `measured`, un anuncio aún sin medir o midiendo tampoco deja la presentación lista.
 */
export function contentIssues(
  p: Presentation,
  byId: ReadonlyMap<string, Announcement>,
  measured?: ReadonlyMap<string, SlideStatus['status']>,
): ContentIssue[] {
  if (p.items.length === 0) return [{ kind: 'vacia' }]
  return p.items.flatMap(({ announcementId }, index): ContentIssue[] => {
    const a = liveAnnouncement(byId, announcementId)
    if (!a) return [{ kind: 'eliminado', index }]
    const title = displayTitle(a) ?? 'Sin título'
    if (a.status === 'borrador') return [{ kind: 'borrador', announcementId, title }]
    const m = measured?.get(announcementId)
    if (a.status === 'no_cabe' || m === 'no_cabe') return [{ kind: 'no_cabe', announcementId, title }]
    if (measured && m !== 'ok') return [{ kind: 'midiendo', announcementId, title }]
    return []
  })
}
