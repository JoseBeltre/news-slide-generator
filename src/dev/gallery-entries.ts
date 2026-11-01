// Entradas de la galería: cada fixture × plantilla × tema, más las slides especiales.
// Las mismas entradas usan las capturas de regresión (tests/e2e/galeria.spec.ts).
import { FULL, MINIMAL, NORMAL, TEXT_TYPE_IDS, longTitle } from '../../tests/fixtures/announcements'
import { makeCtx } from '../../tests/fixtures/context'
import { PRESET_THEMES } from '../slides/themes'
import type { SlideContext, SlideSpec } from '../slides/templates/contract'
import { DECORATION_VARIANTS } from '../slides/templates/parts/decoration'
import { buildSlides, paletteFor } from '../slides/templates/registry'

export interface GalleryEntry {
  id: string
  label: string
  spec: SlideSpec
  ctx: SlideContext
}

const THEMES = ['neutro', 'cielo'] as const

export function galleryEntries(): GalleryEntry[] {
  const out: GalleryEntry[] = []
  // Direcciones visuales (Tarea 5): la misma slide con cada decoración.
  for (const variant of DECORATION_VARIANTS) {
    for (const [typeId, themeId, values] of [
      ['culto', 'neutro', FULL.culto],
      ['culto', 'cielo', FULL.culto],
      ['salida', 'vino', NORMAL.salida],
      ['aviso', 'arena', NORMAL.aviso],
    ] as const) {
      const ctx = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)! })
      const [spec] = buildSlides({ typeId, templateId: 'clasica', values, logo: { kind: 'iglesia' } }, ctx)
      out.push({ id: `direccion-${variant}-${typeId}-${themeId}`, label: `dirección ${variant} · ${typeId} · ${themeId}`, spec: { ...spec!, decoration: variant } as SlideSpec, ctx })
    }
  }
  for (const themeId of THEMES) {
    const ctx = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)! })
    out.push({ id: `portada-${themeId}`, label: `Portada · ${themeId}`, spec: { kind: 'cover', palette: paletteFor({}, undefined, ctx) }, ctx })
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
