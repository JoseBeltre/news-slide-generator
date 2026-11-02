// Anuncios vivos de la base de datos con los filtros de la lista (RF-08). Lo usan Inicio y Anuncios.
import { computed, ref } from 'vue'
import { filterAnnouncements, type AnnouncementView } from '../../../data/announcements'
import type { Announcement } from '../../../data/models'
import { useDb, useLiveQuery } from '../../../data/useDb'
import { toIsoDate } from '../../../lib/format'

export function useAnnouncementList(opts: { limit?: number } = {}) {
  const db = useDb()
  const all = useLiveQuery<Announcement[] | undefined>(
    () => db.announcements.filter((a) => !a.deletedAt).toArray(),
    undefined,
  )
  const view = ref<AnnouncementView>('activos')
  const typeId = ref<string | undefined>()
  const today = toIsoDate(new Date())

  const items = computed(() => {
    const list = filterAnnouncements(all.value ?? [], { view: view.value, typeId: typeId.value, today })
    return opts.limit ? list.slice(0, opts.limit) : list
  })
  /** Falso hasta la primera lectura: evita mostrar "no hay anuncios" un instante al abrir. */
  const loaded = computed(() => all.value !== undefined)

  return { view, typeId, items, loaded, today }
}
