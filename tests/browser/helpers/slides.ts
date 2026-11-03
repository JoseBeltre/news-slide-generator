// Monta una SlideSpec en SlideView y espera a que esté lista para medir: todos los textos ajustados
// y todas las imágenes cargadas. Lo usan las pruebas de plantillas y la matriz de §5.7.
import { FitText } from '../../../src/slides/engine'
import SlideView from '../../../src/slides/templates/SlideView.vue'
import type { SlideContext, SlideSpec, SlideStatus } from '../../../src/slides/templates/contract'
import { frame, mountInHost } from './mount'

export async function until(check: () => boolean | Promise<boolean>, ms = 5000) {
  const end = performance.now() + ms
  while (!(await check())) {
    if (performance.now() > end) throw new Error('tiempo agotado')
    await frame()
  }
}

export async function renderSlide(spec: SlideSpec, ctx: SlideContext) {
  const { wrapper, host } = mountInHost(SlideView, 1920, 1080, { props: { spec, ctx } })
  await until(() => {
    const texts = wrapper.findAllComponents(FitText)
    return (
      texts.every((t) => (t.emitted('fit') ?? []).length > 0) &&
      [...host.querySelectorAll('img')].every((img) => img.complete) &&
      (wrapper.emitted('status') ?? []).length > 0
    )
  })
  await frame()
  const status = wrapper.emitted('status')!.at(-1)![0] as SlideStatus
  const canvas = host.querySelector('.slide-canvas') as HTMLElement
  return { status, canvas, host, wrapper }
}

/** Rectángulo de un elemento en px del lienzo (1920×1080). */
export function canvasRect(el: Element, canvas: HTMLElement) {
  const c = canvas.getBoundingClientRect()
  const scale = c.width / 1920
  const r = el.getBoundingClientRect()
  return { x: (r.left - c.left) / scale, y: (r.top - c.top) / scale, width: r.width / scale, height: r.height / scale }
}
