import { afterEach, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import SlideCanvas from '../../../src/slides/engine/SlideCanvas.vue'
import { cleanupMounted, frame, mountInHost } from '../helpers/mount'

afterEach(cleanupMounted)

async function montar(width: number, height: number, props: Record<string, unknown> = {}) {
  const { host } = mountInHost(SlideCanvas, width, height, { props, slots: { default: () => h('p', 'Hola') } })
  await nextTick()
  await frame()
  const canvas = host.querySelector<HTMLElement>('.slide-canvas')!
  return { host, canvas, rect: () => canvas.getBoundingClientRect(), hostRect: host.getBoundingClientRect() }
}

it('se escala a 960×540 dentro de un host de 960×540', async () => {
  const { rect, hostRect } = await montar(960, 540)
  const r = rect()
  expect(r.width).toBeCloseTo(960, 0)
  expect(r.height).toBeCloseTo(540, 0)
  expect(r.left - hostRect.left).toBeCloseTo(0, 0)
  expect(r.top - hostRect.top).toBeCloseTo(0, 0)
})

it('se centra verticalmente en un host de 1000×1000', async () => {
  const { rect, hostRect } = await montar(1000, 1000)
  const r = rect()
  expect(r.width).toBeCloseTo(1000, 0)
  expect(r.height).toBeCloseTo(562.5, 0)
  expect(r.top - hostRect.top).toBeCloseTo(218.75, 0)
})

it('reacciona al cambio de tamaño del host', async () => {
  const { host, rect } = await montar(960, 540)
  host.style.width = '480px'
  host.style.height = '270px'
  await frame()
  expect(rect().width).toBeCloseTo(480, 0)
})

it('el lienzo mide 1920×1080 en px lógicos y renderiza el slot', async () => {
  const { canvas } = await montar(960, 540)
  expect(canvas.offsetWidth).toBe(1920)
  expect(canvas.offsetHeight).toBe(1080)
  expect(canvas.textContent).toBe('Hola')
})

it('expone la familia de fuente como variable CSS', async () => {
  const { canvas } = await montar(960, 540)
  expect(getComputedStyle(canvas).getPropertyValue('--slide-font-family')).toContain('Atkinson Hyperlegible')
  expect(getComputedStyle(canvas).fontFamily).toContain('Atkinson Hyperlegible')
})

it('acepta otra familia (token para F2)', async () => {
  const { canvas } = await montar(960, 540, { fontFamily: 'Otra Fuente' })
  expect(getComputedStyle(canvas).getPropertyValue('--slide-font-family')).toContain('Otra Fuente')
})
