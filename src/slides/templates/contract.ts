// Contrato de plantilla (§7): un anuncio → una o varias SlideSpec (varias solo en cumpleaños, C-07).
// Cada SlideSpec lleva ya su paleta resuelta, así la vista previa, las miniaturas y la ventana
// pública la dibujan igual sin volver a calcular nada (§8.2).
import type { DateStyle } from '../../lib/format'
import type { Announcement, LogoSelection, Ministry, Settings, Theme } from '../../data/models'
import type { NormalizedData } from '../normalize'
import type { SlidePalette } from '../themes'
import type { DecorationVariant } from './parts/decoration'
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
    'churchName' | 'coverTitle' | 'timeFormat' | 'currency' | 'birthdayDefaultMessage' | 'dateStyle' | 'relativeDates'
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
      /** Solo para comparar direcciones visuales en la galería; si falta, la elegida. */
      decoration?: DecorationVariant
    }
  | {
      kind: 'birthday-single'
      person: Person
      dayText: string
      message: string
      verse?: string
      logo: LogoSelection
      palette: SlidePalette
    }
  | {
      kind: 'birthday-group'
      people: Array<Person & { dayText: string }>
      message: string
      logo: LogoSelection
      palette: SlidePalette
      page?: [number, number]
    }
  | { kind: 'image'; imageId: string }
  | { kind: 'cover' | 'closing'; palette: SlidePalette }

export type AnnouncementInput = Pick<Announcement, 'typeId' | 'templateId' | 'values' | 'logo'> &
  Partial<Pick<Announcement, 'customPrimaryColor' | 'dateStyle' | 'relativeDates'>>

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
