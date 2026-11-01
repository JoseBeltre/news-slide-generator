import { afterEach, describe, expect, it } from 'vitest'
import { auditSlide } from '../../../src/slides/engine'
import { SLIDE_STYLES } from '../../../src/slides/styles'
import { buildSlides } from '../../../src/slides/templates/registry'
import { NORMAL } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'
import { syntheticCutout } from '../../fixtures/images'
import { cleanupMounted } from '../helpers/mount'
import { canvasRect, renderSlide, until } from '../helpers/slides'

afterEach(cleanupMounted)

const intersects = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

describe.each(SLIDE_STYLES.map((s) => s.id))('Visual · estilo %s', (slideStyle) => {
  it('culto con foto → la foto en su panel, ningún texto encima (§5.5), sin violaciones', async () => {
    const photo = await syntheticCutout()
    const ctx = makeCtx({ loadImage: async (id) => (id === 'foto' ? photo : undefined) })
    const values = { ...NORMAL.culto, fotoPredicador: 'foto' }
    const [spec] = buildSlides({ typeId: 'culto', templateId: 'visual', values, logo: { kind: 'iglesia' }, slideStyle }, ctx)
    const { status, canvas, host } = await renderSlide(spec!, ctx)
    await until(() => !!host.querySelector<HTMLImageElement>('[data-photo]')?.complete)
    expect(status).toEqual({ status: 'ok', offendingFields: [] })
    const panel = canvasRect(host.querySelector('[data-photo]')!, canvas)
    for (const el of canvas.querySelectorAll('[data-role]')) expect(intersects(canvasRect(el, canvas), panel)).toBe(false)
    expect(auditSlide(canvas)).toEqual([])
  })

  it('Visual sin foto → los mismos textos que la Clásica', async () => {
    const ctx = makeCtx()
    const texts = async (templateId: 'clasica' | 'visual') => {
      const [spec] = buildSlides({ typeId: 'culto', templateId, values: NORMAL.culto, logo: { kind: 'iglesia' }, slideStyle }, ctx)
      const { canvas } = await renderSlide(spec!, ctx)
      const out = [...canvas.querySelectorAll('[data-role]')].map((el) => `${el.getAttribute('data-role')}:${el.textContent}`)
      cleanupMounted()
      return out
    }
    expect(await texts('visual')).toEqual(await texts('clasica'))
  })
})
