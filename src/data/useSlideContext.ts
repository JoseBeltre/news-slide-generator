// Contexto con el que se dibujan las slides (editor y presentaciones): Configuración, ministerios,
// tema de la iglesia e imágenes guardadas. Se actualiza solo si cambian en la base de datos.
import { computed, type Ref } from 'vue'
import { getImageBlob } from './local/images'
import { PRELOADED_MINISTRIES, listMinistries } from './ministries'
import { DEFAULT_SETTINGS, SETTINGS_ID, loadSettings } from './settings'
import { useDb, useLiveQuery } from './useDb'
import { toIsoDate } from '../lib/format'
import type { SlideContext } from '../slides/templates/contract'
import { PRESET_THEMES } from '../slides/themes'

/** Con `presentationDate`, las fechas relativas y los cumpleaños se calculan para ese día. */
export function useSlideContext(presentationDate?: Ref<string | undefined>): Ref<SlideContext> {
  const db = useDb()
  const settings = useLiveQuery(() => loadSettings(db), { ...DEFAULT_SETTINGS, id: SETTINGS_ID, updatedAt: '' })
  const ministries = useLiveQuery(() => listMinistries(db), [...PRELOADED_MINISTRIES])
  const today = toIsoDate(new Date())
  const loadImage = (id: string) => getImageBlob(db, id)

  return computed(() => ({
    today,
    presentationDate: presentationDate?.value,
    ministries: ministries.value,
    theme: PRESET_THEMES.find((t) => t.id === settings.value.defaultThemeId) ?? PRESET_THEMES[0]!,
    settings: settings.value,
    loadImage,
  }))
}
