// Contrato de plantilla (§7): un anuncio → una o varias SlideSpec (varias solo en cumpleaños, C-07).
// Cada SlideSpec lleva ya su paleta resuelta, así la vista previa, las miniaturas y la ventana
// pública la dibujan igual sin volver a calcular nada (§8.2).
import type { DateStyle } from '../../lib/format'
import type { Announcement, LogoSelection, Ministry, Settings, Theme } from '../../data/models'
import type { NormalizedData } from '../normalize'
import type { SlidePalette } from '../themes'
import type { SlideStyleId } from '../styles'
import type { Person } from '../types/validation'
import type { AnnouncementTypeId } from '../types/fields'

export interface SlideContext {
  /** 'YYYY-MM-DD' de hoy. */
  today: string
  /** 'YYYY-MM-DD' de la presentación; si falta, `today`. Base de las fechas relativas y de los cumpleaños. */
  presentationDate?: string
  ministries: readonly Ministry[]
  /** Tema por defecto de la iglesia (RF-33); el anuncio puede pedir otro color. */
  theme: Theme
  settings: Pick<
    Settings,
    'churchName' | 'coverTitle' | 'timeFormat' | 'currency' | 'birthdayDefaultMessage' | 'dateStyle' | 'relativeDates' | 'slideStyle'
  >
  /** Blob de una imagen guardada (fotos, flyers, logos subidos). */
  loadImage: (imageId: string) => Promise<Blob | undefined>
}

export type SlideSpec =
  | {
      kind: 'announcement'
      templateId: 'clasica' | 'visual'
      data: NormalizedData
      logo: LogoSelection
      palette: SlidePalette
      slideStyle: SlideStyleId
    }
  | {
      kind: 'birthday-single'
      person: Person
      /** "7 de noviembre"; sin él, el día no se muestra (oculto o es el mismo día de la presentación). */
      dayText?: string
      message: string
      verse?: string
      logo: LogoSelection
      palette: SlidePalette
      slideStyle: SlideStyleId
    }
  | {
      kind: 'birthday-group'
      /** Sin fotos: las listas de cumpleaños no llevan imágenes (pedido del responsable). */
      people: Array<{ name: string; day: number; month: number; dayText?: string }>
      /** Hasta 6 personas: tarjetas 3 × 2; más: lista de 2 columnas × 4. */
      layout: 'tarjetas' | 'lista'
      message: string
      logo: LogoSelection
      palette: SlidePalette
      slideStyle: SlideStyleId
      /** "(1/2)": solo si el grupo ocupa más de una slide (RF-25). */
      page?: [number, number]
    }
  | { kind: 'image'; imageId: string }
  | { kind: 'cover' | 'closing'; palette: SlidePalette; slideStyle: SlideStyleId }

export type AnnouncementInput = Pick<Announcement, 'typeId' | 'templateId' | 'values' | 'logo'> &
  Partial<Pick<Announcement, 'customPrimaryColor' | 'dateStyle' | 'relativeDates' | 'slideStyle'>>

export interface SlideStatus {
  status: 'ok' | 'no_cabe'
  offendingFields: string[]
  reason?: 'fit' | 'density'
}

export interface TemplateDef {
  id: string
  name: string
  typeIds: readonly AnnouncementTypeId[]
  layout: (a: AnnouncementInput, ctx: SlideContext) => SlideSpec[]
}

/** Estilo de fecha efectivo: el del anuncio o el de Configuración. */
export const dateOptionsFor = (a: AnnouncementInput, ctx: SlideContext): { dateStyle: DateStyle; relativeDates: boolean } => ({
  dateStyle: a.dateStyle ?? ctx.settings.dateStyle,
  relativeDates: a.relativeDates ?? ctx.settings.relativeDates,
})

export const referenceDate = (ctx: SlideContext) => ctx.presentationDate ?? ctx.today
