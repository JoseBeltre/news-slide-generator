// Registro de plantillas y `buildSlides`: el único punto de entrada de anuncio → slides.
import { normalizeAnnouncement } from '../normalize'
import { deriveTheme, resolveTheme, type SlidePalette } from '../themes'
import { getTypeDef } from '../types/definitions'
import type { AnnouncementTypeId } from '../types/fields'
import { dateOptionsFor, referenceDate, type AnnouncementInput, type SlideContext, type SlideSpec, type TemplateDef } from './contract'

const TEXT_TYPES: readonly AnnouncementTypeId[] = ['culto', 'salida', 'obra_misionera', 'actividad', 'aviso']

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
  { id: 'visual', name: 'Visual', typeIds: TEXT_TYPES, layout: announcementLayout('visual') },
  {
    id: 'imagen',
    name: 'Imagen completa',
    typeIds: ['imagen'],
    layout: (a) => [{ kind: 'image', imageId: String(a.values.imagen) }],
  },
])

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
