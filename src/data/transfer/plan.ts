// Plan de importación (RF-112): estado puro de la pantalla de revisión, calculado contra este equipo.
// Lo que ya existe (vivo, mismo id) se importa como copia por defecto o se sobrescribe; una presentación
// no puede caer en una fecha que ya tiene otra.
import { displayTitle } from '../announcements'
import type { AppDb } from '../local/db'
import type { Announcement } from '../models'
import type { TransferBundle } from './format'

export type Resolution = 'copia' | 'sobrescribir'

export interface PlannedAnnouncement {
  id: string
  typeId: string
  title?: string
  exists: boolean
  resolution: Resolution
  included: boolean
}

export interface PlannedPresentation {
  id: string
  date: string
  exists: boolean
  resolution: Resolution
  targetDate: string
}

export interface ImportPlan {
  bundle: TransferBundle
  announcements: PlannedAnnouncement[]
  presentation?: PlannedPresentation
  /** Imágenes del archivo sin su Blob. */
  missingImages: number
  /** Títulos vivos del equipo y fecha → id de la presentación viva. */
  taken: { titles: string[]; dates: Record<string, string> }
}

/** El campo que da nombre a una copia: `titulo` o, si no hay, `tituloInterno`. */
export function copyableTitleField(a: Pick<Announcement, 'values'>): 'titulo' | 'tituloInterno' | undefined {
  const nonEmpty = (v: unknown) => typeof v === 'string' && v.trim() !== ''
  if (nonEmpty(a.values.titulo)) return 'titulo'
  if (nonEmpty(a.values.tituloInterno)) return 'tituloInterno'
  return undefined
}

const copyableTitle = (a: Announcement) => {
  const field = copyableTitleField(a)
  return field ? (a.values[field] as string).trim() : undefined
}

export async function planImport(db: AppDb, bundle: TransferBundle): Promise<ImportPlan> {
  const alive = <T extends { deletedAt?: string | null }>(r: T | undefined): r is T => !!r && !r.deletedAt
  const { content, blobs } = bundle
  const existing = await db.announcements.bulkGet(content.announcements.map((a) => a.id))
  const announcements = content.announcements.map((a, i) => ({
    id: a.id,
    typeId: a.typeId,
    title: displayTitle(a),
    exists: alive(existing[i]),
    resolution: 'copia' as Resolution,
    included: true,
  }))

  let presentation: PlannedPresentation | undefined
  if (content.presentation) {
    const { id, date } = content.presentation
    presentation = { id, date, exists: alive(await db.presentations.get(id)), resolution: 'copia', targetDate: date }
  }

  const titles = (await db.announcements.toArray()).filter(alive).map(copyableTitle).filter((t): t is string => !!t)
  const dates: Record<string, string> = {}
  for (const p of (await db.presentations.toArray()).filter(alive)) dates[p.date] = p.id

  const missingImages = content.images.filter((i) => !blobs.has(i.hash)).length
  return { bundle, announcements, presentation, missingImages, taken: { titles, dates } }
}

/** El primer `${title} (n)` libre, con n ≥ 2: una copia siempre lleva sufijo. */
export function copyTitle(title: string, taken: ReadonlySet<string>): string {
  for (let n = 2; ; n++) {
    const candidate = `${title} (${n})`
    if (!taken.has(candidate)) return candidate
  }
}

/** La fecha elegida ya tiene otra presentación (y no es la que se sobrescribe). */
export function dateConflict(plan: ImportPlan): boolean {
  const p = plan.presentation
  if (!p) return false
  const holder = plan.taken.dates[p.targetDate]
  if (!holder) return false
  return !(p.exists && p.resolution === 'sobrescribir' && holder === p.id)
}

export function canApply(plan: ImportPlan): boolean {
  if (dateConflict(plan)) return false
  return !!plan.presentation || plan.announcements.some((a) => a.included)
}
