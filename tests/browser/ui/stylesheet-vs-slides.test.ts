// La hoja de la interfaz (Tailwind + preflight) no debe cambiar cómo se dibujan ni miden las slides.
import { afterEach, describe, expect, it } from 'vitest'
import uiCss from '../../../src/ui/styles.css?inline'
import { auditSlide } from '../../../src/slides/engine'
import type { SlideContext, SlideSpec } from '../../../src/slides/templates/contract'
import { buildSlides } from '../../../src/slides/templates/registry'
import { NORMAL } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'
import { syntheticCutout, syntheticFlyer } from '../../fixtures/images'
import { cleanupMounted } from '../helpers/mount'
import { canvasRect, renderSlide, until } from '../helpers/slides'

let sheet: HTMLStyleElement | undefined
afterEach(() => {
  cleanupMounted()
  sheet?.remove()
  sheet = undefined
})

const MARKED = '[data-role], [data-image], [data-photo], [data-logo]'
const keyOf = (el: Element) =>
  `${el.getAttribute('data-role') ?? el.getAttribute('data-image') ?? (el.hasAttribute('data-photo') ? 'foto' : 'logo')}:${el.textContent}`

async function boxes(spec: SlideSpec, ctx: SlideContext) {
  const { status, canvas, host } = await renderSlide(spec, ctx)
  await until(() => [...host.querySelectorAll('img')].every((i) => i.complete))
  await until(() => [...host.querySelectorAll<HTMLElement>('[data-image]')].every((i) => i.style.visibility !== 'hidden'))
  const out = [...canvas.querySelectorAll(MARKED)].map((el) => ({ key: keyOf(el), ...canvasRect(el, canvas) }))
  const violations = auditSlide(canvas)
  cleanupMounted()
  return { status, out, violations }
}

async function compare(spec: SlideSpec, ctx: SlideContext) {
  const plain = await boxes(spec, ctx)
  sheet = document.createElement('style')
  sheet.textContent = uiCss
  document.head.appendChild(sheet)
  const styled = await boxes(spec, ctx)
  expect(uiCss).toContain('--color-background')
  expect(styled.status).toEqual(plain.status)
  expect(styled.violations).toEqual([])
  expect(styled.out.map((b) => b.key)).toEqual(plain.out.map((b) => b.key))
  styled.out.forEach((b, i) => {
    const a = plain.out[i]!
    for (const k of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(b[k] - a[k]), `${b.key} ${k}`).toBeLessThanOrEqual(1)
  })
}

describe('la hoja de la interfaz no cambia las slides', () => {
  it('culto Clásica', async () => {
    const ctx = makeCtx()
    const [spec] = buildSlides({ typeId: 'culto', templateId: 'clasica', values: NORMAL.culto, logo: { kind: 'iglesia' } }, ctx)
    await compare(spec!, ctx)
  })

  it('culto Visual con foto', async () => {
    const photo = await syntheticCutout()
    const ctx = makeCtx({ loadImage: async (id) => (id === 'foto' ? photo : undefined) })
    const values = { ...NORMAL.culto, fotoPredicador: 'foto' }
    const [spec] = buildSlides({ typeId: 'culto', templateId: 'visual', values, logo: { kind: 'iglesia' } }, ctx)
    await compare(spec!, ctx)
  })

  it('slide de imagen', async () => {
    const flyer = await syntheticFlyer(1080, 1920)
    const ctx = makeCtx({ loadImage: async (id) => (id === 'flyer' ? flyer : undefined) })
    await compare({ kind: 'image', imageId: 'flyer' }, ctx)
  })
})
