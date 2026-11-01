import { expect, it } from 'vitest'
import { summarizeFit } from '../../../src/slides/engine/fitReport'
import type { FitReport } from '../../../src/slides/engine/types'

const ok: FitReport = {
  slotId: 'a',
  fieldKey: 'titulo',
  result: { status: 'fits', fontSize: 120, lines: 1, belowPreferred: false },
}
const vacio: FitReport = { slotId: 'b', fieldKey: 'lugar', result: { status: 'empty' } }
const largo: FitReport = { slotId: 'c', fieldKey: 'descripcion', result: { status: 'too_long', minFontSize: 52 } }
const largoSinCampo: FitReport = { slotId: 'd', result: { status: 'too_long', minFontSize: 36 } }

it('sin informes o con solo fits/empty → ok', () => {
  expect(summarizeFit([])).toEqual({ status: 'ok', offendingSlots: [], offendingFields: [] })
  expect(summarizeFit([ok, vacio])).toEqual({ status: 'ok', offendingSlots: [], offendingFields: [] })
})

it('algún too_long → no_cabe, sin duplicados y en orden', () => {
  expect(summarizeFit([ok, largo, largo])).toEqual({
    status: 'no_cabe',
    offendingSlots: ['c'],
    offendingFields: ['descripcion'],
  })
})

it('un slot sin campo cuenta como slot culpable pero no como campo', () => {
  expect(summarizeFit([largoSinCampo, largo])).toEqual({
    status: 'no_cabe',
    offendingSlots: ['d', 'c'],
    offendingFields: ['descripcion'],
  })
})
