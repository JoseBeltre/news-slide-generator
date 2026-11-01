import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, type VNode } from 'vue'
import SlideCanvas from '../../../src/slides/engine/SlideCanvas.vue'
import FitText from '../../../src/slides/engine/FitText.vue'
import { auditSlide } from '../../../src/slides/engine/audit'
import { cleanupMounted, frame, mountInHost } from '../helpers/mount'

afterEach(cleanupMounted)

type Box = { x: number; y: number; w: number; h: number }
const abs = ({ x, y, w, h }: Box) => `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px`

const texto = (role: string, box: Box, size: number, extra: Record<string, unknown> = {}, color = '#ffffff') =>
  h('div', { 'data-role': role, style: `${abs(box)};font-size:${size}px;color:${color};margin:0`, ...extra }, 'Texto')

const logo = (box: Box, extra: Record<string, unknown> = {}) => h('div', { 'data-logo': '', style: abs(box), ...extra })
const icono = (box: Box) => h('div', { 'data-icon': '', style: abs(box) })

/** Slide de prueba: fondo sólido (o degradado con data-bg) que ocupa todo el lienzo. */
function fondo(children: VNode[], bg = '#0b1f3a', extra: Record<string, unknown> = {}) {
  return h('div', { style: `position:absolute;inset:0;background:${bg}`, ...extra }, children)
}

async function auditar(slide: () => VNode) {
  const { host } = mountInHost(SlideCanvas, 960, 540, { slots: { default: slide } })
  await nextTick()
  await frame()
  const canvas = host.querySelector<HTMLElement>('.slide-canvas')!
  return { canvas, codes: () => auditSlide(canvas).map((v) => v.code) }
}

const TITULO: Box = { x: 96, y: 64, w: 1000, h: 200 }
const DATO: Box = { x: 200, y: 400, w: 800, h: 120 }

describe('auditSlide (§5.7)', () => {
  it('slide conforme → sin violaciones', async () => {
    const { codes } = await auditar(() =>
      fondo([
        texto('title', TITULO, 120),
        texto('key', DATO, 80),
        icono({ x: 110, y: 400, w: 64, h: 64 }),
        logo({ x: 1600, y: 64, w: 200, h: 120 }),
      ]),
    )
    expect(codes()).toEqual([])
  })

  it('título a 80px → font_below_min', async () => {
    const { codes } = await auditar(() => fondo([texto('title', TITULO, 80)]))
    expect(codes()).toEqual(['font_below_min'])
  })

  it('cada rol usa su propio mínimo', async () => {
    const { codes } = await auditar(() =>
      fondo([texto('secondary', DATO, 44), texto('meta', { ...DATO, y: 600 }, 31)]),
    )
    expect(codes()).toEqual(['font_below_min'])
  })

  it('elemento en x = 50 → outside_safe_area', async () => {
    const { codes } = await auditar(() => fondo([texto('title', { ...TITULO, x: 50 }, 120)]))
    expect(codes()).toEqual(['outside_safe_area'])
  })

  it('gris sobre gris → low_contrast', async () => {
    const { codes } = await auditar(() => fondo([texto('title', TITULO, 120, {}, '#777777')], '#999999'))
    expect(codes()).toEqual(['low_contrast'])
  })

  it('sin ningún fondo declarado se audita contra blanco', async () => {
    const { codes } = await auditar(() => h('div', [texto('title', TITULO, 120, {}, '#ffffff')]))
    expect(codes()).toEqual(['low_contrast'])
  })

  it('degradado con una parada mala → low_contrast', async () => {
    const { codes } = await auditar(() =>
      fondo([texto('title', TITULO, 120)], 'linear-gradient(#0b1f3a, #cfd8dc)', { 'data-bg': '#0b1f3a,#cfd8dc' }),
    )
    expect(codes()).toEqual(['low_contrast'])
  })

  it('degradado con todas las paradas buenas → sin violaciones', async () => {
    const { codes } = await auditar(() =>
      fondo([texto('title', TITULO, 120)], 'linear-gradient(#0b1f3a, #1e3a8a)', { 'data-bg': '#0b1f3a,#1e3a8a' }),
    )
    expect(codes()).toEqual([])
  })

  it('data-fit="too_long" → text_overflow', async () => {
    const { codes } = await auditar(() => fondo([texto('title', TITULO, 96, { 'data-fit': 'too_long' })]))
    expect(codes()).toEqual(['text_overflow'])
  })

  it('logo de 200px → logo_size; con data-cover es válido', async () => {
    const grande = await auditar(() => fondo([logo({ x: 1500, y: 64, w: 200, h: 200 })]))
    expect(grande.codes()).toEqual(['logo_size'])
    cleanupMounted()
    const portada = await auditar(() => fondo([logo({ x: 760, y: 300, w: 400, h: 300 }, { 'data-cover': '' })]))
    expect(portada.codes()).toEqual([])
  })

  it('logo de 60px → logo_size; logo fuera del área segura → outside_safe_area', async () => {
    const { codes } = await auditar(() =>
      fondo([logo({ x: 1600, y: 64, w: 100, h: 60 }), logo({ x: 1800, y: 900, w: 100, h: 100 })]),
    )
    expect(codes()).toEqual(['logo_size', 'outside_safe_area'])
  })

  it('ícono de 48px → icon_size', async () => {
    const { codes } = await auditar(() => fondo([icono({ x: 110, y: 400, w: 48, h: 48 })]))
    expect(codes()).toEqual(['icon_size'])
  })

  it('cada violación trae el elemento y un detalle legible', async () => {
    const { canvas } = await auditar(() => fondo([texto('title', TITULO, 80)]))
    const [v] = auditSlide(canvas)
    expect(v!.element.getAttribute('data-role')).toBe('title')
    expect(v!.detail).toMatch(/80/)
  })

  it('con FitText real y texto imposible → text_overflow pero nunca font_below_min', async () => {
    const largo = Array.from({ length: 60 }, (_, i) => `palabra${i}`).join(' ')
    const slot = { id: 'titulo', role: 'title' as const, box: { x: 96, y: 64, width: 1728, height: 400 } }
    const { canvas, codes } = await auditar(() =>
      fondo([h('div', { style: 'color:#ffffff' }, [h(FitText, { slot, text: largo })])]),
    )
    await vi.waitFor(() => expect(canvas.querySelector('[data-fit]')).not.toBeNull())
    expect(codes()).toEqual(['text_overflow'])
  })
})
