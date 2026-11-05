// Configuración de la iglesia (RF-110, RF-111): un solo registro, editado en la página Configuración.
// Sin registro guardado, la app usa estos valores por defecto.
import type { AppDb } from './local/db'
import { createRepository } from './local/repository'
import type { Settings } from './models'

export const SETTINGS_ID = 'configuracion'

export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'updatedAt'> = Object.freeze({
  churchName: 'Mansedumbre II',
  coverTitle: 'Anuncios',
  defaultThemeId: 'neutro',
  currency: 'DOP',
  timeFormat: '12h',
  birthdayDefaultMessage: '¡Feliz cumpleaños!',
  dateStyle: 'largo',
  relativeDates: false,
  slideStyle: 'almanaque',
})

/** El registro guardado o, si no hay, los valores por defecto. */
export async function loadSettings(db: AppDb): Promise<Settings> {
  const saved = await createRepository(db.settings).get(SETTINGS_ID)
  return saved ?? { ...DEFAULT_SETTINGS, id: SETTINGS_ID, updatedAt: new Date(0).toISOString() }
}

export type SettingsPatch = Partial<Omit<Settings, 'id' | 'updatedAt'>>

/** Textos que, vacíos, vuelven a su valor por defecto. */
const DEFAULTED_TEXTS = ['coverTitle', 'birthdayDefaultMessage'] as const

/** Mezcla el cambio con lo guardado y lo guarda (entra en `outbox`, se sincroniza). */
export async function saveSettings(db: AppDb, patch: SettingsPatch): Promise<Settings> {
  const { id: _id, updatedAt: _u, deletedAt: _d, ...current } = await loadSettings(db)
  const next = { ...current, ...patch }
  for (const key of DEFAULTED_TEXTS) next[key] = next[key].trim() || DEFAULT_SETTINGS[key]
  return createRepository(db.settings).put({ ...next, id: SETTINGS_ID })
}
