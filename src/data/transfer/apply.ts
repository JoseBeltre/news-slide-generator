// Aplicar la importación (RF-112) en una sola transacción: imágenes por hash, anuncios (copia con id
// nuevo y "(n)" o mismo id) y la presentación con sus `items` apuntando a los ids finales. Todo pasa
// por el repositorio o `outbox`, así que se sincroniza. Si algo falla, no queda nada.
import type { AppDb } from '../local/db'
import { createRepository } from '../local/repository'
import type { Announcement } from '../models'
import { importImages, remapImageIds } from './images'
import { canApply, copyableTitleField, copyTitle, type ImportPlan } from './plan'

export interface ImportResult {
  announcementIds: string[]
  presentationId?: string
}

export async function applyImport(db: AppDb, plan: ImportPlan): Promise<ImportResult> {
  if (!canApply(plan)) throw new Error('La importación no se puede aplicar: revisa la fecha.')
  const { content, blobs } = plan.bundle
  const included = plan.announcements.filter((a) => a.included)
  const source = new Map(content.announcements.map((a) => [a.id, a]))
  const tables = [db.announcements, db.presentations, db.images, db.imageBlobs, db.outbox]

  return db.transaction('rw', tables, async () => {
    const now = new Date().toISOString()
    const usedImages = new Set(included.flatMap((p) => source.get(p.id)!.imageIds))
    const imageIds = await importImages(db, content.images.filter((i) => usedImages.has(i.id)), blobs, now)

    const announcements = createRepository(db.announcements)
    const titles = new Set(plan.taken.titles)
    const finalIds = new Map<string, string>()
    for (const planned of included) {
      const original = source.get(planned.id)!
      const copy = planned.exists && planned.resolution === 'copia'
      const values = remapImageIds(original.values, imageIds)
      const field = copyableTitleField(original)
      if (copy && field) values[field] = copyTitle((values[field] as string).trim(), titles)
      if (field) titles.add((values[field] as string).trim())
      const { updatedAt: _u, deletedAt: _d, ...rest } = original
      const record: Omit<Announcement, 'updatedAt'> = { ...rest, id: copy ? crypto.randomUUID() : original.id, values, imageIds: remapImageIds(original.imageIds, imageIds) }
      finalIds.set(planned.id, (await announcements.put(record)).id)
    }

    const result: ImportResult = { announcementIds: [...finalIds.values()] }
    if (content.presentation && plan.presentation) {
      const p = plan.presentation
      const { updatedAt: _u, deletedAt: _d, ...rest } = content.presentation
      const items = rest.items.filter((i) => finalIds.has(i.announcementId)).map((i) => ({ ...i, announcementId: finalIds.get(i.announcementId)! }))
      const id = p.exists && p.resolution === 'copia' ? crypto.randomUUID() : p.id
      result.presentationId = (await createRepository(db.presentations).put({ ...rest, id, date: p.targetDate, items })).id
    }
    return result
  })
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "Se importaron 3 anuncios y 1 presentación", "Se importó 1 anuncio", "Se importó 1 presentación". */
export function importSummary(r: ImportResult): string {
  const parts = [
    ...(r.announcementIds.length ? [count(r.announcementIds.length, 'anuncio', 'anuncios')] : []),
    ...(r.presentationId ? ['1 presentación'] : []),
  ]
  const first = r.announcementIds.length || 1
  return `${first === 1 ? 'Se importó' : 'Se importaron'} ${parts.join(' y ')}`
}
