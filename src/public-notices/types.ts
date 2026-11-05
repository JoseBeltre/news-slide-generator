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
  | { kind: 'fresh'; data: PublicNoticesData; savedAt: string }
  | { kind: 'cached'; data: PublicNoticesData; savedAt: string }
  | { kind: 'offline' }
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
