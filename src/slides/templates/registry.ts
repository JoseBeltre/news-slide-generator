// Registro de plantillas y `buildSlides`: el único punto de entrada de anuncio → slides.
import { normalizeAnnouncement } from '../normalize'
import { contrastRatio } from '../engine'
import { PRESET_THEMES, deriveTheme, mixColors, resolveTheme, type SlidePalette } from '../themes'
import { getTypeDef } from '../types/definitions'
import type { AnnouncementTypeId } from '../types/fields'
import { birthdayLayout, type BirthdayValues } from './birthday/layout'
import { dateOptionsFor, referenceDate, type AnnouncementInput, type SlideContext, type SlideSpec, type TemplateDef } from './contract'

const TEXT_TYPES: readonly AnnouncementTypeId[] = ['culto', 'salida', 'obra_misionera', 'actividad', 'aviso']
/** La Visual dibuja la foto del anuncio: solo para tipos con un campo de imagen (hoy, culto). */
const PHOTO_TYPES = TEXT_TYPES.filter((id) => getTypeDef(id).fields.some((f) => f.kind === 'image'))

/**
 * Paleta del anuncio, con el acento del tipo: su color personalizado (RF-32), si no el tema que eligió
 * (RF-31) y si no el tema de la iglesia.
 */
export function paletteFor(
  a: Pick<AnnouncementInput, 'customPrimaryColor' | 'themeId'>,
  typeId: AnnouncementTypeId | undefined,
  ctx: SlideContext,
): SlidePalette {
  if (a.customPrimaryColor) return deriveTheme(a.customPrimaryColor, typeId).palette
  const theme = PRESET_THEMES.find((t) => t.id === a.themeId) ?? ctx.theme
  return resolveTheme(theme, typeId).palette
}

/**
 * Las listas de cumpleaños van siempre en fondo claro (pedido del responsable): un tema oscuro se
 * aclara a un tinte de su propio fondo, con el contraste recalculado.
 */
export function lightPalette(palette: SlidePalette): SlidePalette {
  const dark = contrastRatio('#ffffff', palette.background[0]!) > contrastRatio('#000000', palette.background[0]!)
  return dark ? deriveTheme(mixColors(palette.background[0]!, '#ffffff', 0.9), 'cumpleanos').palette : palette
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
      return pages.map((page) => ({ ...page, ...framing, ...(page.kind === 'birthday-group' ? { palette: lightPalette(framing.palette) } : {}) }))
    },
  },
  {
    id: 'imagen',
    name: 'Imagen completa',
    typeIds: ['imagen'],
    // Sin imagen todavía (borrador): no hay slide que dibujar.
    layout: (a) => (typeof a.values.imagen === 'string' && a.values.imagen ? [{ kind: 'image', imageId: a.values.imagen }] : []),
  },
])

/** Portada o cierre de la presentación: tema de la iglesia y estilo por defecto de Configuración. */
export function frameSlide(kind: 'cover' | 'closing', ctx: SlideContext, slideStyle = ctx.settings.slideStyle): SlideSpec {
  return { kind, palette: paletteFor({}, undefined, ctx), slideStyle }
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
