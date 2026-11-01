import { afterEach, expect, it, vi } from 'vitest'
import FitText from '../../../src/slides/engine/FitText.vue'
import type { FitReport, TextSlotDef } from '../../../src/slides/engine/types'
import { cleanupMounted, mountInHost } from '../helpers/mount'

afterEach(cleanupMounted)

const titulo: TextSlotDef = {
  id: 'titulo',
  role: 'title',
  fieldKey: 'titulo',
  box: { x: 96, y: 64, width: 1728, height: 400 },
}
const secundario: TextSlotDef = {
  id: 'descripcion',
  role: 'secondary',
  fieldKey: 'descripcion',
  box: { x: 96, y: 500, width: 1728, height: 300 },
}
const LARGO = Array.from({ length: 60 }, (_, i) => `palabra${i}`).join(' ')

function montar(props: { slot: TextSlotDef; text: string }) {
  const { wrapper, host } = mountInHost(FitText, 1920, 1080, { props })
  const reports = () => (wrapper.emitted('fit') ?? []).map((args) => args[0] as FitReport)
  const el = () => host.querySelector<HTMLElement>(`[data-slot-id="${props.slot.id}"]`)
  return { wrapper, reports, el }
}

it('texto que cabe → emite fits y se dibuja a ese tamaño', async () => {
  const { reports, el } = montar({ slot: titulo, text: 'Culto de Jóvenes' })
  await vi.waitFor(() => expect(reports()).toHaveLength(1))
  expect(reports()[0]).toEqual({
    slotId: 'titulo',
    fieldKey: 'titulo',
    result: { status: 'fits', fontSize: 132, lines: 1, belowPreferred: false },
  })
  expect(el()!.dataset.fit).toBe('fits')
  expect(el()!.dataset.role).toBe('title')
  expect(getComputedStyle(el()!).fontSize).toBe('132px')
  expect(el()!.textContent).toBe('Culto de Jóvenes')
})

it('texto largo → emite too_long y se dibuja exactamente al mínimo, nunca por debajo', async () => {
  const { reports, el } = montar({ slot: titulo, text: LARGO })
  await vi.waitFor(() => expect(reports()).toHaveLength(1))
  expect(reports()[0]!.result).toEqual({ status: 'too_long', minFontSize: 84 })
  expect(el()!.dataset.fit).toBe('too_long')
  expect(getComputedStyle(el()!).fontSize).toBe('84px')
  expect(getComputedStyle(el()!).overflow).toBe('hidden')
})

it('texto vacío → emite empty y no deja ningún elemento (sin hueco)', async () => {
  const { reports, el } = montar({ slot: titulo, text: '   ' })
  await vi.waitFor(() => expect(reports()).toHaveLength(1))
  expect(reports()[0]!.result).toEqual({ status: 'empty' })
  expect(el()).toBeNull()
})

it('al cambiar el texto vuelve a medir y emite de nuevo', async () => {
  const { wrapper, reports } = montar({ slot: titulo, text: LARGO })
  await vi.waitFor(() => expect(reports()).toHaveLength(1))
  await wrapper.setProps({ text: 'Ayuno' })
  await vi.waitFor(() => expect(reports()).toHaveLength(2))
  expect(reports()[1]!.result.status).toBe('fits')
})

it('peso según el rol: título 700, secundario 400', async () => {
  const a = montar({ slot: titulo, text: 'Título' })
  const b = montar({ slot: secundario, text: 'Detalle' })
  await vi.waitFor(() => expect(a.el()).not.toBeNull())
  await vi.waitFor(() => expect(b.el()).not.toBeNull())
  expect(getComputedStyle(a.el()!).fontWeight).toBe('700')
  expect(getComputedStyle(b.el()!).fontWeight).toBe('400')
  expect(parseFloat(getComputedStyle(a.el()!).lineHeight)).toBeCloseTo(132 * 1.05, 1)
})

it('se posiciona en la caja del slot', async () => {
  const { el } = montar({ slot: secundario, text: 'Detalle' })
  await vi.waitFor(() => expect(el()).not.toBeNull())
  const s = getComputedStyle(el()!)
  expect([s.position, s.left, s.top, s.width, s.height]).toEqual(['absolute', '96px', '500px', '1728px', '300px'])
})
