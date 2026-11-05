// La configuración en vivo para la página y su guardado al momento (RF-111).
import type { Ref } from 'vue'
import type { Settings } from '../../data/models'
import { DEFAULT_SETTINGS, SETTINGS_ID, loadSettings, saveSettings, type SettingsPatch } from '../../data/settings'
import { useDb, useLiveQuery } from '../../data/useDb'

export function useSettings(): { settings: Readonly<Ref<Settings>>; save(patch: SettingsPatch): Promise<Settings> } {
  const db = useDb()
  const initial: Settings = { ...DEFAULT_SETTINGS, id: SETTINGS_ID, updatedAt: new Date(0).toISOString() }
  const settings = useLiveQuery(() => loadSettings(db), initial)
  return {
    settings,
    save: (patch) => saveSettings(db, patch),
  }
}
