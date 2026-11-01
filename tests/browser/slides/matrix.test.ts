// Matriz de legibilidad (§5.7, §10.13): cada estilo × tipo × caso extremo × tema. Toda slide "ok" pasa
// auditSlide (mínimos, área segura, contraste); las que no caben lo dicen con su campo, y solo las esperadas.
import { afterEach, describe, expect, it } from 'vitest'
import type { Theme } from '../../../src/data/models'
import { auditSlide } from '../../../src/slides/engine'
import { SLIDE_STYLES, type SlideStyleId } from '../../../src/slides/styles'
import { PRESET_THEMES } from '../../../src/slides/themes'
import type { AnnouncementInput, SlideContext, SlideSpec } from '../../../src/slides/templates/contract'
import { buildSlides, frameSlide } from '../../../src/slides/templates/registry'
import { FULL, MINIMAL, NORMAL, TEXT_TYPE_IDS, longTitle, type TextTypeId } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'
import { syntheticCutout, syntheticFlyer } from '../../fixtures/images'
import { cleanupMounted } from '../helpers/mount'
import { renderSlide } from '../helpers/slides'

afterEach(cleanupMounted)

const STYLES = SLIDE_STYLES.map((s) => s.id)
const theme = (id: string): Theme => PRESET_THEMES.find((t) => t.id === id)!
/** Neutro (oscuro), cielo (claro) y un color personalizado de bajo contraste (§10.9). */
const THEMES: Array<[string, Partial<AnnouncementInput>, Theme]> = [
  ['neutro', {}, theme('neutro')],
  ['cielo', {}, theme('cielo')],
  ['#fff59d', { customPrimaryColor: '#fff59d' }, theme('neutro')],
]

const images: Record<string, () => Promise<Blob>> = {
  foto: () => syntheticCutout(),
  vertical: () => syntheticFlyer(1080, 1920),
  horizontal: () => syntheticFlyer(1920, 1080),
}
const loadImage = async (id: string) => images[id]?.()

type Variant = 'normal' | 'lleno' | 'minimo' | 'titulo_largo' | 'sin_logo' | 'medio_relativas'
const VARIANTS: Record<Variant, (t: TextTypeId) => Partial<AnnouncementInput> & { values: Record<string, unknown> }> = {
  normal: (t) => ({ values: NORMAL[t] }),
  lleno: (t) => ({ values: FULL[t] }),
  minimo: (t) => ({ values: MINIMAL[t] }),
  titulo_largo: (t) => ({ values: longTitle(t) }),
  sin_logo: (t) => ({ values: NORMAL[t], logo: { kind: 'ninguno' } }),
  medio_relativas: (t) => ({ values: NORMAL[t], dateStyle: 'medio', relativeDates: true }),
}

/** Casos que deben salir "No cabe", con su campo culpable. */
function expectedNoCabe(typeId: TextTypeId, variant: Variant): string[] | undefined {
  if (variant === 'titulo_largo') return ['titulo']
  if (variant === 'lleno' && typeId === 'salida') return ['contacto']
  return undefined
}

async function check(spec: SlideSpec, ctx: SlideContext, expected?: string[]) {
  const { status, canvas } = await renderSlide(spec, ctx)
  if (expected) {
    expect(status.status).toBe('no_cabe')
    expect(status.offendingFields).toEqual(expected)
  } else {
    expect(status).toEqual({ status: 'ok', offendingFields: [] })
    expect(auditSlide(canvas)).toEqual([])
  }
}

const announcement = (slideStyle: SlideStyleId, typeId: TextTypeId, input: Partial<AnnouncementInput> & { values: Record<string, unknown> }, ctx: SlideContext, templateId = 'clasica') =>
  buildSlides({ typeId, templateId, logo: { kind: 'iglesia' }, slideStyle, ...input }, ctx)[0]!

describe.each(STYLES)('matriz §5.7 · estilo %s', (slideStyle) => {
  const ctx = makeCtx({ presentationDate: '2026-11-07', loadImage })

  for (const typeId of TEXT_TYPE_IDS) {
    for (const variant of Object.keys(VARIANTS) as Variant[]) {
      it(`${typeId} · ${variant} · neutro`, () =>
        check(announcement(slideStyle, typeId, VARIANTS[variant](typeId), ctx), ctx, expectedNoCabe(typeId, variant)))
    }
    for (const [name, extra, t] of THEMES.slice(1)) {
      it(`${typeId} · normal · ${name}`, () => {
        const themed = makeCtx({ theme: t, loadImage })
        return check(announcement(slideStyle, typeId, { values: NORMAL[typeId], ...extra }, themed), themed)
      })
    }
  }

  for (const [name, extra, t] of THEMES) {
    const themed = makeCtx({ theme: t, loadImage, settings: { ...makeCtx().settings, slideStyle } })
    it(`Visual con foto · ${name}`, () =>
      check(announcement(slideStyle, 'culto', { values: { ...NORMAL.culto, fotoPredicador: 'foto' }, ...extra }, themed, 'visual'), themed))
    it(`portada · ${name}`, () => check(frameSlide('cover', themed), themed))
    it(`cierre · ${name}`, () => check(frameSlide('closing', themed), themed))
  }
})

describe('matriz §5.7 · imagen', () => {
  for (const imageId of ['vertical', 'horizontal']) {
    it(`flyer ${imageId}`, () => check({ kind: 'image', imageId }, makeCtx({ loadImage })))
  }
})
