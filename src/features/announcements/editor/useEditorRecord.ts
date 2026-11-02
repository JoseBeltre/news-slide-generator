// Qué anuncio abre el editor según la ruta: uno guardado (/anuncios/:id) o uno nuevo de un tipo
// (/anuncios/nuevo/:typeId). Al guardar uno nuevo la ruta pasa a /anuncios/:id sin recargarlo.
import { ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { draftFrom } from '../../../data/announcements'
import { createRepository, type NewRecord } from '../../../data/local/repository'
import type { Announcement } from '../../../data/models'
import { loadSettings } from '../../../data/settings'
import { useDb } from '../../../data/useDb'
import type { AnnouncementTypeId } from '../../../slides/types/fields'

export function useEditorRecord() {
  const route = useRoute()
  const db = useDb()
  const record = shallowRef<NewRecord<Announcement>>()
  const missing = ref(false)
  /** Cambia solo cuando se abre otro anuncio: el editor se rehace desde cero. */
  const key = ref('')
  let openId: string | undefined

  async function load() {
    const id = route.name === 'editar' ? String(route.params.id) : undefined
    if (id && id === openId) return
    missing.value = false
    record.value = undefined
    if (id) {
      const found = await createRepository(db.announcements).get(id)
      if (!found) return void (missing.value = true)
      record.value = found
    } else {
      record.value = draftFrom(route.params.typeId as AnnouncementTypeId, await loadSettings(db))
    }
    openId = id
    key.value = id ?? `nuevo-${String(route.params.typeId)}-${Date.now()}`
  }

  watch(() => [route.name, route.params.id, route.params.typeId], load, { immediate: true })

  /** El editor guardó por primera vez: ese id ya está abierto. */
  const onSaved = (a: Announcement) => (openId = a.id)

  return { record, missing, key, onSaved }
}
