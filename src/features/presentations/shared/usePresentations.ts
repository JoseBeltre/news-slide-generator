// Presentaciones guardadas (RF-50): próximas y pasadas, crear (una por fecha) y eliminar.
// Lo usan la lista y la tarjeta de Inicio.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { createRepository } from '../../../data/local/repository'
import type { Presentation } from '../../../data/models'
import { newPresentation } from '../../../data/presentations'
import { useDb, useLiveQuery } from '../../../data/useDb'
import { formatDate, toIsoDate } from '../../../lib/format'
import { useConfirm } from '../../../ui/useConfirm'

export function usePresentations() {
  const db = useDb()
  const repo = createRepository(db.presentations)
  const router = useRouter()
  const confirm = useConfirm()
  const today = toIsoDate(new Date())
  const all = useLiveQuery<Presentation[] | undefined>(() => db.presentations.filter((p) => !p.deletedAt).toArray(), undefined)

  const byDate = (list: Presentation[], dir: 1 | -1) => [...list].sort((a, b) => dir * a.date.localeCompare(b.date))
  const upcoming = computed(() => byDate((all.value ?? []).filter((p) => p.date >= today), 1))
  const past = computed(() => byDate((all.value ?? []).filter((p) => p.date < today), -1))
  const loaded = computed(() => all.value !== undefined)

  /** Abre la presentación de esa fecha; si no hay, la crea con los anuncios sugeridos (RF-52). */
  /** Leer y crear en una sola transacción: un doble clic no deja dos presentaciones en la misma fecha. */
  async function openOrCreate(date: string): Promise<string> {
    const id = await db.transaction('rw', db.presentations, db.announcements, db.outbox, async () => {
      const existing = (await db.presentations.where('date').equals(date).toArray()).find((p) => !p.deletedAt)
      return existing?.id ?? (await repo.put(newPresentation(date, await db.announcements.toArray()))).id
    })
    await router.push({ name: 'presentacion', params: { id } })
    return id
  }

  async function remove(p: Presentation): Promise<void> {
    const title = `¿Eliminar la presentación del ${formatDate(p.date).toLowerCase()}? Los anuncios no se borran.`
    if (await confirm({ title, confirmLabel: 'Eliminar', danger: true })) await repo.remove(p.id)
  }

  return { upcoming, past, loaded, today, openOrCreate, remove }
}
