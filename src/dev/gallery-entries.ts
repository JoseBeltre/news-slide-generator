// Entradas de la galería: cada fixture × plantilla × tema, más las slides especiales.
// Las mismas entradas usan las capturas de regresión (tests/e2e/galeria.spec.ts).
import { FULL, MINIMAL, NORMAL, TEXT_TYPE_IDS, longTitle } from '../../tests/fixtures/announcements'
import { makeCtx } from '../../tests/fixtures/context'
import { syntheticCutout, syntheticFlyer } from '../../tests/fixtures/images'
import { TEST_MINISTRIES } from '../../tests/fixtures/ministries'
import { SLIDE_STYLES } from '../slides/styles'
import { PRESET_THEMES } from '../slides/themes'
import type { SlideContext, SlideSpec } from '../slides/templates/contract'
import { buildSlides, frameSlide, templatesFor } from '../slides/templates/registry'

export interface GalleryEntry {
  id: string
  label: string
  spec: SlideSpec
  ctx: SlideContext
}

const THEMES = ['neutro', 'cielo'] as const
const IGLESIA = { kind: 'iglesia' } as const
const NINGUNO = { kind: 'ninguno' } as const
const DOS = { kind: 'varios', ministryIds: ['iglesia', 'jovenes'] } as const
const TRES_ISOTIPOS = { kind: 'varios', ministryIds: ['jovenes', 'mujer', 'iglesia'], form: 'isotipo' } as const
// Extremos realistas: el máximo de §5.4 (6 líneas) y el maxLength del título (60).
const { contacto: _, ...SALIDA_6_LINEAS } = FULL.salida
const TITULO_60 = 'Gran campaña de evangelismo juvenil con invitados especiales'

// Imágenes sintéticas (se generan al pedirlas): flyers y la foto recortada del predicador.
const IMAGES: Record<string, () => Promise<Blob>> = {
  'flyer-vertical': () => syntheticFlyer(1080, 1920),
  'flyer-horizontal': () => syntheticFlyer(1920, 1080),
  'foto-predicador': () => syntheticCutout(),
}
const loadImage = async (id: string) => IMAGES[id]?.()

export function galleryEntries(): GalleryEntry[] {
  const out: GalleryEntry[] = []
  // Cada estilo (§9) con datos extremos, temas claro y oscuro, y grupos de logos.
  for (const { id: slideStyle } of SLIDE_STYLES) {
    for (const [name, typeId, themeId, values, logo] of [
      ['culto-lleno', 'culto', 'neutro', FULL.culto, IGLESIA],
      ['culto-lleno', 'culto', 'cielo', FULL.culto, IGLESIA],
      ['salida-llena', 'salida', 'vino', SALIDA_6_LINEAS, IGLESIA],
      ['actividad-titulo-largo', 'actividad', 'arena', { ...FULL.actividad, titulo: TITULO_60 }, IGLESIA],
      ['obra-sin-logo', 'obra_misionera', 'bosque', NORMAL.obra_misionera, NINGUNO],
      ['aviso-sin-fecha', 'aviso', 'pizarra', NORMAL.aviso, IGLESIA],
      ['dos-logos', 'actividad', 'neutro', NORMAL.actividad, DOS],
      ['tres-isotipos', 'culto', 'cielo', NORMAL.culto, TRES_ISOTIPOS],
    ] as const) {
      const ctx = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)!, ministries: TEST_MINISTRIES })
      const [spec] = buildSlides({ typeId, templateId: 'clasica', values, logo, slideStyle }, ctx)
      out.push({ id: `estilo-${slideStyle}-${name}-${themeId}`, label: `${slideStyle} · ${name} · ${themeId}`, spec: spec!, ctx })
    }
    // Visual: la Clásica con la foto del predicador (solo culto tiene campo de imagen).
    for (const themeId of ['neutro', 'cielo', 'vino']) {
      const ctx = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)!, loadImage })
      for (const [name, values] of [
        ['visual', { ...NORMAL.culto, fotoPredicador: 'foto-predicador' }],
        ['visual-lleno', { ...FULL.culto, fotoPredicador: 'foto-predicador' }],
      ] as const) {
        const [spec] = buildSlides({ typeId: 'culto', templateId: 'visual', values, logo: IGLESIA, slideStyle }, ctx)
        out.push({ id: `estilo-${slideStyle}-${name}-${themeId}`, label: `${slideStyle} · ${name} · ${themeId}`, spec: spec!, ctx })
      }
    }
    for (const themeId of THEMES) {
      const base = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)! })
      const ctx = makeCtx({ ...base, settings: { ...base.settings, slideStyle } })
      out.push({ id: `estilo-${slideStyle}-portada-${themeId}`, label: `${slideStyle} · portada · ${themeId}`, spec: frameSlide('cover', ctx), ctx })
      out.push({ id: `estilo-${slideStyle}-cierre-${themeId}`, label: `${slideStyle} · cierre · ${themeId}`, spec: frameSlide('closing', ctx), ctx })
    }
  }
  for (const imageId of ['flyer-vertical', 'flyer-horizontal']) {
    out.push({ id: `imagen-${imageId}`, label: `imagen · ${imageId}`, spec: { kind: 'image', imageId }, ctx: makeCtx({ loadImage }) })
  }
  for (const themeId of THEMES) {
    const ctx = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)! })
    for (const typeId of TEXT_TYPE_IDS) {
      for (const { id: templateId } of templatesFor(typeId)) {
        const variants = { normal: NORMAL[typeId], lleno: FULL[typeId], minimo: MINIMAL[typeId], titulo_largo: longTitle(typeId) }
        for (const [variant, values] of Object.entries(variants)) {
          const [spec] = buildSlides({ typeId, templateId, values, logo: { kind: 'iglesia' } }, ctx)
          out.push({ id: `${templateId}-${typeId}-${variant}-${themeId}`, label: `${templateId} · ${typeId} · ${variant} · ${themeId}`, spec: spec!, ctx })
        }
      }
    }
  }
  return out
}
