import { afterEach, describe, expect, it } from 'vitest'
import { auditSlide } from '../../../src/slides/engine'
import { SLIDE_STYLES } from '../../../src/slides/styles'
import { PRESET_THEMES } from '../../../src/slides/themes'
import { frameSlide } from '../../../src/slides/templates/registry'
import { makeCtx } from '../../fixtures/context'
import { cleanupMounted } from '../helpers/mount'
import { canvasRect, renderSlide } from '../helpers/slides'

afterEach(cleanupMounted)

describe.each(SLIDE_STYLES.map((s) => s.id))('portada y cierre · estilo %s', (slideStyle) => {
  for (const kind of ['cover', 'closing'] as const) {
    for (const themeId of ['neutro', 'cielo']) {
      it(`${kind} sobre ${themeId} → ok, logo de portada ≤ 400 px, sin violaciones`, async () => {
        const base = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === themeId)! })
        const ctx = makeCtx({ ...base, settings: { ...base.settings, slideStyle } })
        const { status, canvas } = await renderSlide(frameSlide(kind, ctx), ctx)
        expect(status).toEqual({ status: 'ok', offendingFields: [] })
        const logo = canvas.querySelector('[data-cover]')
        expect(logo).not.toBeNull()
        expect(canvasRect(logo!, canvas).height).toBeLessThanOrEqual(400.5)
        expect(auditSlide(canvas)).toEqual([])
      })
    }
  }

  it('el cierre dice "¡Feliz sábado!" en lugar del título de portada', async () => {
    const base = makeCtx()
    const ctx = makeCtx({ settings: { ...base.settings, slideStyle, coverTitle: 'Anuncios' } })
    const { canvas } = await renderSlide(frameSlide('closing', ctx), ctx)
    expect(canvas.textContent).toContain('¡Feliz sábado!')
    expect(canvas.textContent).not.toContain('Anuncios')
  })

  // Pedido del responsable: en el cierre, el logo debajo del saludo y más pequeño que en la portada; centrado
  // (vertical) salvo en el Cartel, que va alineado a la izquierda y usa el horizontal.
  it('el cierre lleva el logo debajo del saludo y más pequeño que en la portada', async () => {
    const base = makeCtx()
    const ctx = makeCtx({ settings: { ...base.settings, slideStyle } })
    const cover = await renderSlide(frameSlide('cover', ctx), ctx)
    const coverHeight = canvasRect(cover.canvas.querySelector('[data-cover]')!, cover.canvas).height
    cleanupMounted()
    const { canvas } = await renderSlide(frameSlide('closing', ctx), ctx)
    const logo = canvas.querySelector('[data-cover]')!
    expect(logo.getAttribute('src')).toMatch(slideStyle === 'cartel' ? /iasd-horizontal/ : /iasd-vertical/)
    const greeting = [...canvas.querySelectorAll('[data-role="title"]')].find((el) => el.textContent!.includes('¡Feliz sábado!'))!
    const g = canvasRect(greeting, canvas)
    const l = canvasRect(logo, canvas)
    expect(l.y).toBeGreaterThanOrEqual(g.y + g.height)
    expect(l.height).toBeLessThan(coverHeight)
  })

  it('nombre de iglesia de 40 caracteres → ok', async () => {
    const base = makeCtx()
    const ctx = makeCtx({ settings: { ...base.settings, slideStyle, churchName: 'Iglesia Adventista Mansedumbre II Norte' } })
    const { status } = await renderSlide(frameSlide('cover', ctx), ctx)
    expect(status.status).toBe('ok')
  })
})
