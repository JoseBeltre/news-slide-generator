// La presentación abierta y los anuncios que la forman, en vivo. Cada cambio se guarda al momento:
// son acciones pequeñas y reversibles, sin botón "Guardar".
import { computed, type Ref } from 'vue'
import { createRepository } from '../../../data/local/repository'
import type { Announcement, Presentation } from '../../../data/models'
import { useDb, useLiveQuery } from '../../../data/useDb'
import { plainCopy } from '../../../lib/plain'

type Patch = Partial<Pick<Presentation, 'items' | 'showCover' | 'showClosing' | 'coverTitle' | 'slideStyle'>>

export function usePresentationRecord(id: Ref<string>) {
  const db = useDb()
  const repo = createRepository(db.presentations)
  const found = useLiveQuery<Presentation | null | undefined>(async () => (await repo.get(id.value)) ?? null, undefined, id)
  const announcements = useLiveQuery<Announcement[]>(() => db.announcements.toArray(), [])

  const presentation = computed(() => found.value ?? undefined)
  const missing = computed(() => found.value === null || !!found.value?.deletedAt)
  /** Todos, también los borrados: la lista los muestra como "Anuncio eliminado". */
  const byId = computed<ReadonlyMap<string, Announcement>>(() => new Map(announcements.value.map((a) => [a.id, a])))

  /**
   * Aplica el cambio sobre lo último guardado, dentro de una transacción: dos cambios seguidos (escribir
   * el título y marcar "Cierre", bajar y quitar) no se pisan aunque la lectura en vivo aún no llegó.
   */
  async function update(change: Patch | ((current: Presentation) => Patch)): Promise<void> {
    await db.transaction('rw', db.presentations, db.outbox, async () => {
      const current = await repo.get(id.value)
      if (!current) return
      const patch = typeof change === 'function' ? change(current) : change
      await repo.put({ ...current, ...plainCopy(patch) })
    })
  }

  return { presentation, missing, byId, announcements, update }
}
