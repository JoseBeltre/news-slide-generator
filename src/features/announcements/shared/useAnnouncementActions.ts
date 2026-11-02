// Acciones sobre un anuncio que ofrecen varias pantallas: duplicar (RF-02) y eliminar (borrado lógico).
import { useRouter } from 'vue-router'
import { displayTitle, duplicate } from '../../../data/announcements'
import { createRepository } from '../../../data/local/repository'
import type { Announcement } from '../../../data/models'
import { useDb } from '../../../data/useDb'
import { useConfirm } from '../../../ui/useConfirm'

export function useAnnouncementActions() {
  const repo = createRepository(useDb().announcements)
  const router = useRouter()
  const confirm = useConfirm()

  /** Crea la copia y abre su editor con el foco en la fecha, lo primero que se cambia al reutilizar. */
  async function duplicateAndOpen(a: Announcement): Promise<void> {
    const copy = await repo.put(duplicate(a, new Date().toISOString()))
    await router.push({ name: 'editar', params: { id: copy.id }, query: { foco: 'fecha' } })
  }

  /** Pregunta y, si se confirma, lo borra. Devuelve si se borró. */
  async function remove(a: Announcement): Promise<boolean> {
    const name = displayTitle(a)
    const ok = await confirm({
      title: name ? `¿Eliminar «${name}»?` : '¿Eliminar este anuncio?',
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (ok) await repo.remove(a.id)
    return ok
  }

  return { duplicateAndOpen, remove }
}
