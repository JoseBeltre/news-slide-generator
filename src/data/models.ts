// Entidades persistidas (§7). Todas llevan SyncMeta para la sincronización del paso 8 (§8.4).
import type { DateStyle } from '../lib/format'
import type { SlideStyleId } from '../slides/styles'
import type { LogoOrientation } from '../slides/engine'

export interface SyncMeta {
  /** UUID generado en el cliente. */
  id: string
  /** ISO; resolución de conflictos por registro (last-write-wins). */
  updatedAt: string
  /** Borrado lógico, para que el borrado se propague al sincronizar. */
  deletedAt?: string | null
}

/** Tablas que se sincronizan con la nube (§8.4), en el orden en que se suben y bajan. */
export const SYNC_TABLES = ['announcements', 'ministries', 'images', 'presentations', 'themes', 'settings'] as const
export type SyncTable = (typeof SYNC_TABLES)[number]

/** Un registro cambiado localmente que falta subir. Solo dice qué; el contenido se lee al subir. */
export interface OutboxEntry {
  table: SyncTable
  id: string
}

/** Estado del sincronizador: `cursor:<tabla>` (último `synced_at` bajado) y `lastSyncAt`. */
export interface SyncStateEntry {
  key: string
  value: string
}

/** Logotipo (el logo completo) o isotipo (el símbolo solo, circular o cuadrado: variante `cuadrado`). */
export type LogoForm = 'logotipo' | 'isotipo'

/**
 * RF-09 / RF-37 (v1.4): ninguno, la iglesia (por defecto), un ministerio o varios (2–3, puede incluir
 * la iglesia). `form` pide logotipo o isotipo; si un ministerio no tiene esa forma, se usa la que tenga.
 */
export type LogoSelection =
  | { kind: 'ninguno' }
  | { kind: 'iglesia'; form?: LogoForm }
  | { kind: 'ministerio'; ministryId: string; form?: LogoForm }
  | { kind: 'varios'; ministryIds: readonly string[]; form?: LogoForm }

export interface Announcement extends SyncMeta {
  typeId: string
  templateId: string
  logo: LogoSelection
  /** Si falta, el tema por defecto de la iglesia. */
  themeId?: string
  customPrimaryColor?: string
  /** Si faltan, los de Configuración. */
  dateStyle?: DateStyle
  relativeDates?: boolean
  /** Estilo de la slide (§9); si falta, el de Configuración. */
  slideStyle?: SlideStyleId
  /** Validado contra el tipo con `validateValues`. */
  values: Record<string, unknown>
  imageIds: string[]
  presenterNotes?: string
  /** 'YYYY-MM-DD', para archivar y sugerir. */
  eventDate?: string
  status: 'borrador' | 'listo' | 'no_cabe'
  createdBy?: string
  updatedBy?: string
  createdAt: string
}

/** Logo precargado en el código (`asset`) o subido desde la app (`image`). */
export type LogoSource = { kind: 'asset'; src: string } | { kind: 'image'; imageId: string }

/** §7 + `dominantColor`, obligatorio en la variante a color: el motor lo usa para medir el contraste (RF-37). */
export type LogoVariant = { source: LogoSource; orientation: LogoOrientation } & (
  | { color: 'blanco' }
  | { color: 'negro' }
  | { color: 'color'; dominantColor: string }
)

export interface Ministry extends SyncMeta {
  name: string
  /** El ministerio raíz = la iglesia local. */
  isChurch: boolean
  logos: LogoVariant[]
}

export type ImageKind = 'foto' | 'flyer' | 'logo' | 'asset'

export interface ImageAsset extends SyncMeta {
  /** Ruta en el almacenamiento en la nube, basada en el hash. */
  storagePath: string
  /** SHA-256 del contenido, para evitar duplicados. */
  hash: string
  width: number
  height: number
  kind: ImageKind
}

/** El Blob vive solo en la caché local (IndexedDB), no en la tabla sincronizada. */
export interface ImageBlob {
  id: string
  blob: Blob
}

export interface Presentation extends SyncMeta {
  /** 'YYYY-MM-DD' (normalmente un sábado). */
  date: string
  /** El orden del array es el orden de proyección. */
  items: { announcementId: string }[]
  showCover: boolean
  showClosing: boolean
  /** Título de la portada solo para esta presentación; vacío → el de Configuración (RF-53). */
  coverTitle?: string
  /** Estilo de la portada y el cierre solo para esta presentación; sin él → el de Configuración (§9). */
  slideStyle?: SlideStyleId
  published: boolean
  readingSlug?: string
}

export interface Theme extends SyncMeta {
  name: string
  primary: string
  secondary: string
  background: string
  /** En el MVP siempre 'Atkinson Hyperlegible' (token para F2). */
  fontFamily: string
}

export interface Settings extends SyncMeta {
  churchName: string
  defaultThemeId: string
  currency: string
  timeFormat: '12h' | '24h'
  birthdayDefaultMessage: string
  coverTitle: string
  /** Estilo de fecha por defecto en las slides; por defecto 'largo'. */
  dateStyle: DateStyle
  /** "HOY" / "ESTA NOCHE" / "MAÑANA" frente a la fecha de la presentación; por defecto false. */
  relativeDates: boolean
  /** Estilo de slide por defecto (§9): Himnario, Almanaque o Cartel. */
  slideStyle: SlideStyleId
}
