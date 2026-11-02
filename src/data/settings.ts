// Configuración de la iglesia (RF-110): un solo registro. Mientras no exista la pantalla de
// Configuración, la app usa estos valores por defecto.
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
