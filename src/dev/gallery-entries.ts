// Entradas de la galería: cada fixture × plantilla × tema, más las slides especiales.
// Las mismas entradas usan las capturas de regresión (tests/e2e/galeria.spec.ts).
import { FULL, MINIMAL, NORMAL, TEXT_TYPE_IDS, longTitle } from '../../tests/fixtures/announcements'
import { makeCtx } from '../../tests/fixtures/context'
import { TEST_MINISTRIES } from '../../tests/fixtures/ministries'
import { SLIDE_STYLES } from '../slides/styles'
import { PRESET_THEMES } from '../slides/themes'
import type { SlideContext, SlideSpec } from '../slides/templates/contract'
import { buildSlides, paletteFor } from '../slides/templates/registry'

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
    for (const themeId of THEMES) {
      const ctx = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)! })
      out.push({ id: `estilo-${slideStyle}-portada-${themeId}`, label: `${slideStyle} · portada · ${themeId}`, spec: { kind: 'cover', palette: paletteFor({}, undefined, ctx), slideStyle }, ctx })
    }
  }
  for (const themeId of THEMES) {
    const ctx = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)! })
    for (const templateId of ['clasica', 'visual'] as const) {
      for (const typeId of TEXT_TYPE_IDS) {
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
