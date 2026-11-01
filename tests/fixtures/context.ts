// Contexto de slides para pruebas y galería: tema neutro, iglesia precargada, sin base de datos.
import { PRELOADED_MINISTRIES } from '../../src/data/ministries'
import { NEUTRAL_THEME_ID, PRESET_THEMES } from '../../src/slides/themes'
import type { SlideContext } from '../../src/slides/templates/contract'

export function makeCtx(overrides: Partial<SlideContext> = {}): SlideContext {
  return {
    today: '2026-11-01',
    presentationDate: '2026-11-07',
    ministries: PRELOADED_MINISTRIES,
    theme: PRESET_THEMES.find((t) => t.id === NEUTRAL_THEME_ID)!,
    settings: {
      churchName: 'Mansedumbre II',
      coverTitle: 'Anuncios',
      timeFormat: '12h',
      currency: 'DOP',
      birthdayDefaultMessage: '¡Feliz cumpleaños!',
      dateStyle: 'largo',
      relativeDates: false,
    },
    loadImage: async () => undefined,
    ...overrides,
  }
}
