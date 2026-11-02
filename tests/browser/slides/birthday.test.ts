import { afterEach, describe, expect, it } from 'vitest'
import { auditSlide } from '../../../src/slides/engine'
import { SLIDE_STYLES } from '../../../src/slides/styles'
import type { SlideSpec } from '../../../src/slides/templates/contract'
import { buildSlides } from '../../../src/slides/templates/registry'
import { makeCtx } from '../../fixtures/context'
import { syntheticPortrait } from '../../fixtures/images'
import { cleanupMounted } from '../helpers/mount'
import { canvasRect, renderSlide, until } from '../helpers/slides'

afterEach(cleanupMounted)

const P = (name: string, day: number, month: number, photoId?: string) => ({ name, day, month, ...(photoId ? { photoId } : {}) })
const intersects = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

describe.each(SLIDE_STYLES.map((s) => s.id))('cumpleaños · estilo %s', (slideStyle) => {
  const ctx = makeCtx({ loadImage: async (id) => (id.startsWith('foto') ? syntheticPortrait() : undefined) })
  const slides = (values: Record<string, unknown>) =>
    buildSlides({ typeId: 'cumpleanos', templateId: 'cumpleanos', values, logo: { kind: 'iglesia' }, slideStyle }, ctx)
  const waitPhotos = (host: HTMLElement, n: number) =>
    until(() => {
      const imgs = [...host.querySelectorAll<HTMLImageElement>('[data-photo]')]
      return imgs.length === n && imgs.every((i) => i.complete)
    })

  it('individual sin foto: nombre corto ≥ 160 px, sin imágenes, avatar ni logo, sin violaciones', async () => {
    const [spec] = slides({ modo: 'individual', personas: [P('Ana', 7, 11)] })
    const { status, canvas } = await renderSlide(spec!, ctx)
    expect(status).toEqual({ status: 'ok', offendingFields: [] })
    expect(canvas.querySelector('[data-photo]')).toBeNull()
    expect(canvas.querySelector('[data-logo]')).toBeNull()
    const name = canvas.querySelector('[data-slot-id="nombre"]') as HTMLElement
    expect(parseFloat(getComputedStyle(name).fontSize)).toBeGreaterThanOrEqual(160)
    expect(auditSlide(canvas)).toEqual([])
  })

  it('individual con foto y versículo: la foto sin texto encima (§5.5), sin violaciones', async () => {
    const [spec] = slides({ modo: 'individual', personas: [P('Juan Carlos Rodríguez Peña', 30, 12, 'foto')], versiculo: 'Enséñanos de tal modo a contar nuestros días, que traigamos al corazón sabiduría. Salmo 90:12' })
    const { status, canvas, host } = await renderSlide(spec!, ctx)
    await waitPhotos(host, 1)
    expect(status).toEqual({ status: 'ok', offendingFields: [] })
    const photo = canvasRect(host.querySelector('[data-photo]')!, canvas)
    for (const el of canvas.querySelectorAll('[data-role]')) expect(intersects(canvasRect(el, canvas), photo)).toBe(false)
    expect(auditSlide(canvas)).toEqual([])
  })

  it('nombre larguísimo → "ok" o "No cabe" señalando personas, nunca letra bajo el mínimo', async () => {
    const [spec] = slides({ modo: 'individual', personas: [P('Maximiliano-Bartolomé de los Santos Ozuna', 7, 11)] })
    const { status, canvas } = await renderSlide(spec!, ctx)
    if (status.status === 'ok') expect(auditSlide(canvas)).toEqual([])
    else expect(status.offendingFields).toEqual(['personas'])
  })

  it('grupo de 6 → tarjetas del mismo tamaño, sin fotos aunque las tengan, sin logo', async () => {
    const personas = ['Ana Lucía', 'José Miguel', 'Marta', 'Pedro Antonio', 'Altagracia', 'Luis'].map((n, i) => P(n, 2 + i, 11, i % 2 === 0 ? `foto-${i}` : undefined))
    const [spec] = slides({ modo: 'grupo', personas })
    const { status, canvas } = await renderSlide(spec!, ctx)
    expect(status).toEqual({ status: 'ok', offendingFields: [] })
    const names = [...canvas.querySelectorAll('[data-role="birthdayNameGroup"]')].map((el) => canvasRect(el, canvas))
    expect(names).toHaveLength(6)
    expect(new Set(names.map((r) => Math.round(r.width))).size).toBe(1)
    expect(canvas.querySelector('[data-photo]')).toBeNull()
    expect(canvas.querySelector('[data-logo]')).toBeNull()
    expect(auditSlide(canvas)).toEqual([])
  })

  it('"Ocultar el día" → ningún día en la slide', async () => {
    const [spec] = slides({ modo: 'individual', personas: [P('Ana', 9, 11)], mostrarDia: 'no' })
    const { status, canvas } = await renderSlide(spec!, ctx)
    expect(status.status).toBe('ok')
    expect(canvas.querySelector('[data-slot-id="dia"]')).toBeNull()
    expect(canvas.textContent).not.toContain('noviembre')
  })

  it('grupo de 9 sin foto → la primera slide con 8 y "(1/2)"', async () => {
    const all = slides({ modo: 'grupo', personas: Array.from({ length: 9 }, (_, i) => P(`Persona ${i + 1}`, 1 + i, 11)) })
    expect(all).toHaveLength(2)
    const { status, canvas } = await renderSlide(all[0] as SlideSpec, ctx)
    expect(status).toEqual({ status: 'ok', offendingFields: [] })
    expect(canvas.querySelectorAll('[data-role="birthdayNameGroup"]')).toHaveLength(8)
    expect(canvas.textContent).toContain('(1/2)')
    expect(auditSlide(canvas)).toEqual([])
  })
})
