import { describe, expect, it } from 'vitest'
import { SAFE_AREA, isInsideSafeArea, validateTextSlot } from '../../../src/slides/engine'
import { normalizeAnnouncement } from '../../../src/slides/normalize'
import { ROW_GAP, SAFE_BOTTOM, detailRows, rowLines, stackRows, titleSlot } from '../../../src/slides/templates/classic/layout'
import { FULL, MINIMAL, NORMAL, TEXT_TYPE_IDS, type TextTypeId } from '../../fixtures/announcements'

const ctx = { today: '2026-11-01', reference: '2026-11-07' }
const data = (typeId: TextTypeId, values: Record<string, unknown>) => normalizeAnnouncement(typeId, values, ctx)
const OPTS = { x: 800, width: 1024, bottom: SAFE_BOTTOM - 16, marker: 56, markerGap: 28 }

describe('layout de la Clásica', () => {
  for (const typeId of TEXT_TYPE_IDS) {
    for (const [name, values] of Object.entries({ normal: NORMAL[typeId], lleno: FULL[typeId], minimo: MINIMAL[typeId] })) {
      it(`${typeId} ${name}: filas dentro del área segura, válidas y sin solaparse`, () => {
        const { rows } = stackRows(detailRows(data(typeId, values)), OPTS)
        for (const r of rows) {
          expect(isInsideSafeArea(r.slot.box)).toBe(true)
          expect(() => validateTextSlot(r.slot)).not.toThrow()
        }
        for (let i = 1; i < rows.length; i++) {
          const prev = rows[i - 1]!.slot.box
          expect(rows[i]!.slot.box.y).toBeGreaterThanOrEqual(prev.y + prev.height + ROW_GAP)
        }
      })
    }
  }

  it('detailRows quita la fila de la fecha (va en el bloque de fecha)', () => {
    const d = data('culto', NORMAL.culto)
    expect(d.rows.some((r) => r.fieldKeys.includes('fecha'))).toBe(true)
    expect(detailRows(d).some((r) => r.fieldKeys.includes('fecha'))).toBe(false)
  })

  it('una descripción corta reserva una sola línea', () => {
    expect(rowLines({ fieldKeys: ['descripcion'], text: 'Canto y poesía', role: 'secondary' }, 1000, 4)).toBe(1)
  })

  it('titleSlot: tantas líneas como quepan al mínimo, hasta 4', () => {
    const box = { x: SAFE_AREA.x, y: SAFE_AREA.y, width: 1000, height: 300 }
    expect(titleSlot('titulo', box).maxLines).toBe(3)
    expect(titleSlot('titulo', { ...box, height: 900 }).maxLines).toBe(4)
    expect(titleSlot('titulo', { ...box, height: 50 }).maxLines).toBe(1)
  })
})
