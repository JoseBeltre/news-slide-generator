// Página pública de anuncios (P9): la respuesta de `public_notices()` y lo que la página dibuja.

export interface PublicNotice {
  id: string
  typeId: string
  values: Record<string, unknown>
  eventDate: string | null
  updatedAt: string
}

export interface PublicNoticesData {
  /** 'YYYY-MM-DD' en Santo Domingo, según el servidor. */
  today: string
  settings: { timeFormat?: '12h' | '24h'; currency?: string; dateStyle?: string }
  notices: PublicNotice[]
}

export type LoadState =
  // `team`: la vista del equipo (spec §6.5), con nombres y contactos privados.
  | { kind: 'fresh'; data: PublicNoticesData; savedAt: string; team?: true }
  | { kind: 'cached'; data: PublicNoticesData; savedAt: string; team?: true }
  | { kind: 'offline' }
  /** "Solo el equipo" en Configuración: la página no muestra anuncios (spec P9 §6.3). */
  | { kind: 'disabled' }
  | { kind: 'error' }

export interface NoticeCard {
  id: string
  number: number
  /** Nombre del tipo ("Culto / Servicio especial"), arriba del título. */
  typeName: string
  typeId: string
  title: string
  rows: { icon?: string; text: string }[]
}
