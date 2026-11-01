import { afterEach, describe, expect, it } from 'vitest'
import type { SlideSpec } from '../../../src/slides/templates/contract'
import { makeCtx } from '../../fixtures/context'
import { syntheticFlyer } from '../../fixtures/images'
import { cleanupMounted } from '../helpers/mount'
import { canvasRect, renderSlide, until } from '../helpers/slides'

afterEach(cleanupMounted)

async function renderImage(width: number, height: number) {
  const blob = await syntheticFlyer(width, height)
  const ctx = makeCtx({ loadImage: async (id) => (id === 'flyer' ? blob : undefined) })
  const spec: SlideSpec = { kind: 'image', imageId: 'flyer' }
  const out = await renderSlide(spec, ctx)
  await until(() => [...out.host.querySelectorAll<HTMLImageElement>('[data-image]')].filter((i) => i.complete && i.naturalWidth > 0).length === 2)
  // La nítida se muestra cuando ya calculó su tamaño.
  await until(() => (out.host.querySelector('[data-image="nitida"]') as HTMLElement).style.visibility !== 'hidden')
  const sharp = out.host.querySelector('[data-image="nitida"]')!
  const fill = out.host.querySelector('[data-image="relleno"]')!
  return { ...out, sharp: canvasRect(sharp, out.canvas), fill: canvasRect(fill, out.canvas) }
}

describe('slide de imagen (RF-40, RF-41)', () => {
  it('flyer vertical 1080×1920 → completo y centrado, con relleno difuminado que cubre el lienzo', async () => {
    const { status, sharp, fill, canvas } = await renderImage(1080, 1920)
    expect(status).toEqual({ status: 'ok', offendingFields: [] })
    expect(sharp.width).toBeCloseTo(607.5, 0)
    expect(sharp.height).toBeCloseTo(1080, 0)
    expect(sharp.x).toBeCloseTo(656.25, 0)
    expect(fill.x).toBeLessThanOrEqual(0)
    expect(fill.y).toBeLessThanOrEqual(0)
    expect(fill.x + fill.width).toBeGreaterThanOrEqual(1920)
    expect(fill.y + fill.height).toBeGreaterThanOrEqual(1080)
    expect(canvas.querySelector('[data-logo]')).toBeNull()
    expect(canvas.querySelector('[data-role]')).toBeNull()
  })

  it('imagen 16:9 → ocupa todo el lienzo', async () => {
    const { sharp } = await renderImage(1920, 1080)
    expect(sharp).toMatchObject({ x: 0, y: 0 })
    expect(sharp.width).toBeCloseTo(1920, 0)
    expect(sharp.height).toBeCloseTo(1080, 0)
  })
})
