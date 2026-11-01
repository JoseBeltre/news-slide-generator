import { afterEach, describe, expect, it } from 'vitest'
import type { LogoSelection } from '../../../src/data/models'
import { defineComponent, h } from 'vue'
import { SlideCanvas, auditSlide } from '../../../src/slides/engine'
import LogoSlot from '../../../src/slides/templates/parts/LogoSlot.vue'
import SlideView from '../../../src/slides/templates/SlideView.vue'
import { buildSlides, paletteFor } from '../../../src/slides/templates/registry'
import type { SlideSpec, SlideStatus } from '../../../src/slides/templates/contract'
import { makeCtx } from '../../fixtures/context'
import { NORMAL } from '../../fixtures/announcements'
import { cleanupMounted, frame, mountInHost } from '../helpers/mount'

afterEach(cleanupMounted)

const until = async (check: () => boolean, ms = 3000) => {
  const end = performance.now() + ms
  while (!check()) {
    if (performance.now() > end) throw new Error('tiempo agotado')
    await frame()
  }
}

describe('SlideView', () => {
  it('dibuja la portada y emite ok', async () => {
    const ctx = makeCtx()
    const spec: SlideSpec = { kind: 'cover', palette: paletteFor({}, undefined, ctx) }
    const { wrapper, host } = mountInHost(SlideView, 1920, 1080, { props: { spec, ctx } })
    await until(() => (wrapper.emitted('status') ?? []).length > 0 && !!host.querySelector('[data-logo]'))
    const last = wrapper.emitted('status')!.at(-1)![0] as SlideStatus
    expect(last).toEqual({ status: 'ok', offendingFields: [] })
    await until(() => (host.querySelector('[data-logo]') as HTMLImageElement).complete)
    await frame()
    expect(auditSlide(host.querySelector('.slide-canvas') as HTMLElement)).toEqual([])
  })

  it('buildSlides con una plantilla desconocida usa la del tipo', () => {
    const [spec] = buildSlides({ typeId: 'culto', templateId: 'no-existe', values: NORMAL.culto, logo: { kind: 'iglesia' } }, makeCtx())
    expect(spec).toMatchObject({ kind: 'announcement', templateId: 'clasica' })
  })
})

describe('LogoSlot (RF-37…39)', () => {
  const box = { x: 1424, y: 64, width: 400, height: 160 }
  const mountLogo = (selection: LogoSelection, background: string[]) =>
    mountInHost(
      defineComponent(() => () =>
        h(SlideCanvas, null, () => [
          h('div', { style: `position:absolute;inset:0;background:${background[0]}`, 'data-bg': background.join(',') }, [
            h(LogoSlot, { selection, ministries: makeCtx().ministries, background, box, loadImage: async () => undefined }),
          ]),
        ]),
      ),
      1920,
      1080,
    )

  it('"ninguno" no deja elemento de logo', async () => {
    const { host } = mountLogo({ kind: 'ninguno' }, ['#0b1f3a'])
    await frame()
    expect(host.querySelector('[data-logo]')).toBeNull()
  })

  it('iglesia sobre azul oscuro → logo blanco horizontal, 90–160 px de alto, dentro de su caja', async () => {
    const { host } = mountLogo({ kind: 'iglesia' }, ['#0b1f3a'])
    await until(() => !!host.querySelector('[data-logo]') && (host.querySelector('[data-logo]') as HTMLImageElement).complete)
    await frame()
    const img = host.querySelector('[data-logo]') as HTMLImageElement
    expect(img.getAttribute('src')).toMatch(/iasd-horizontal-blanco/)
    const canvas = host.querySelector('.slide-canvas') as HTMLElement
    const scale = canvas.getBoundingClientRect().width / 1920
    const r = img.getBoundingClientRect()
    const c = canvas.getBoundingClientRect()
    expect(r.height / scale).toBeGreaterThanOrEqual(90)
    expect(r.height / scale).toBeLessThanOrEqual(160)
    expect((r.right - c.left) / scale).toBeLessThanOrEqual(box.x + box.width + 0.5)
    expect((r.left - c.left) / scale).toBeGreaterThanOrEqual(box.x - 0.5)
  })

  it('iglesia sobre blanco → logo negro', async () => {
    const { host } = mountLogo({ kind: 'iglesia' }, ['#ffffff'])
    await until(() => !!host.querySelector('[data-logo]'))
    expect(host.querySelector('[data-logo]')!.getAttribute('src')).toMatch(/iasd-horizontal-negro/)
  })
})
