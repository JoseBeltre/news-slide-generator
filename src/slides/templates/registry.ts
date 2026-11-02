// Registro de plantillas y `buildSlides`: el único punto de entrada de anuncio → slides.
import { normalizeAnnouncement } from '../normalize'
import { deriveTheme, resolveTheme, type SlidePalette } from '../themes'
import { getTypeDef } from '../types/definitions'
import type { AnnouncementTypeId } from '../types/fields'
import { birthdayLayout, type BirthdayValues } from './birthday/layout'
import { dateOptionsFor, referenceDate, type AnnouncementInput, type SlideContext, type SlideSpec, type TemplateDef } from './contract'

const TEXT_TYPES: readonly AnnouncementTypeId[] = ['culto', 'salida', 'obra_misionera', 'actividad', 'aviso']
/** La Visual dibuja la foto del anuncio: solo para tipos con un campo de imagen (hoy, culto). */
const PHOTO_TYPES = TEXT_TYPES.filter((id) => getTypeDef(id).fields.some((f) => f.kind === 'image'))

/** Paleta del anuncio: su color personalizado (RF-32) o el tema de la iglesia, con el acento del tipo. */
export function paletteFor(a: Pick<AnnouncementInput, 'customPrimaryColor'>, typeId: AnnouncementTypeId | undefined, ctx: SlideContext): SlidePalette {
  return (a.customPrimaryColor ? deriveTheme(a.customPrimaryColor, typeId) : resolveTheme(ctx.theme, typeId)).palette
}

const announcementLayout =
  (templateId: 'clasica' | 'visual') =>
  (a: AnnouncementInput, ctx: SlideContext): SlideSpec[] => {
    const typeId = a.typeId as AnnouncementTypeId
    const data = normalizeAnnouncement(typeId, a.values, {
      today: ctx.today,
      reference: referenceDate(ctx),
      timeFormat: ctx.settings.timeFormat,
      currency: ctx.settings.currency,
      ...dateOptionsFor(a, ctx),
    })
    const slideStyle = a.slideStyle ?? ctx.settings.slideStyle
    return [{ kind: 'announcement', templateId, data, logo: a.logo, palette: paletteFor(a, typeId, ctx), slideStyle }]
  }

export const TEMPLATES: readonly TemplateDef[] = Object.freeze([
  { id: 'clasica', name: 'Clásica', typeIds: TEXT_TYPES, layout: announcementLayout('clasica') },
  { id: 'visual', name: 'Visual', typeIds: PHOTO_TYPES, layout: announcementLayout('visual') },
  {
    id: 'cumpleanos',
    name: 'Cumpleaños',
    typeIds: ['cumpleanos'],
    layout: (a, ctx) => {
      const framing = { logo: a.logo, palette: paletteFor(a, 'cumpleanos', ctx), slideStyle: a.slideStyle ?? ctx.settings.slideStyle }
      const pages = birthdayLayout(a.values as unknown as BirthdayValues, { referenceDate: referenceDate(ctx), defaultMessage: ctx.settings.birthdayDefaultMessage })
      return pages.map((page) => ({ ...page, ...framing }))
    },
  },
  {
    id: 'imagen',
    name: 'Imagen completa',
    typeIds: ['imagen'],
    layout: (a) => [{ kind: 'image', imageId: String(a.values.imagen) }],
  },
])

/** Portada o cierre de la presentación: tema de la iglesia y estilo por defecto de Configuración. */
export function frameSlide(kind: 'cover' | 'closing', ctx: SlideContext): SlideSpec {
  return { kind, palette: paletteFor({}, undefined, ctx), slideStyle: ctx.settings.slideStyle }
}

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function templatesFor(typeId: AnnouncementTypeId): TemplateDef[] {
  return TEMPLATES.filter((t) => t.typeIds.includes(typeId))
}

/** Slides de un anuncio. Una plantilla que no corresponde al tipo cae en la plantilla por defecto del tipo. */
export function buildSlides(a: AnnouncementInput, ctx: SlideContext): SlideSpec[] {
  const typeId = a.typeId as AnnouncementTypeId
  const def = getTypeDef(typeId)
  const available = templatesFor(typeId)
  const template = available.find((t) => t.id === a.templateId) ?? available.find((t) => t.id === def.defaultTemplateId)
  if (!template) throw new Error(`No hay plantilla para el tipo "${typeId}"`)
  return template.layout(a, ctx)
}
