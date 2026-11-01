import { describe, expect, it } from 'vitest'
import { CHURCH_MINISTRY_ID, logoGroupFor } from '../../../src/data/ministries'
import { eventDateParts } from '../../../src/lib/format'
import { isInsideSafeArea, validateTextSlot } from '../../../src/slides/engine'
import { normalizeAnnouncement } from '../../../src/slides/normalize'
import { DEFAULT_SLIDE_STYLE } from '../../../src/slides/styles'
import { detailRows, monthLabel, rowLines, stackRows, titleSlot } from '../../../src/slides/templates/classic/layout'
import { buildSlides } from '../../../src/slides/templates/registry'
import { FULL, NORMAL } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'
import { TEST_MINISTRIES } from '../../fixtures/ministries'

const nctx = { today: '2026-11-01', reference: '2026-11-07', timeFormat: '12h' as const }

describe('eventDateParts', () => {
  it('sábado 7 de noviembre en piezas, sin año si es el de la referencia', () => {
    expect(eventDateParts('2026-11-07', { reference: '2026-11-07' })).toEqual({
      weekday: 'SÁBADO',
      weekdayShort: 'SÁB',
      day: '7',
      month: 'NOVIEMBRE',
      monthShort: 'NOV',
    })
  })

  it('otro año → year; relativa → HOY / ESTA NOCHE / MAÑANA', () => {
    expect(eventDateParts('2027-01-02', { reference: '2026-11-07' }).year).toBe('2027')
    expect(eventDateParts('2026-11-07', { reference: '2026-11-07', relative: true }).relative).toBe('HOY')
    expect(eventDateParts('2026-11-07', { reference: '2026-11-07', relative: true, time: '19:00' }).relative).toBe('ESTA NOCHE')
    expect(eventDateParts('2026-11-08', { reference: '2026-11-07', relative: true }).relative).toBe('MAÑANA')
  })

  it('monthLabel abrevia el mes cuando lleva año', () => {
    expect(monthLabel({ month: 'SEPTIEMBRE', monthShort: 'SEP' })).toBe('SEPTIEMBRE')
    expect(monthLabel({ month: 'SEPTIEMBRE', monthShort: 'SEP', year: '2027' })).toBe('SEP 2027')
  })
})

describe('normalize: fecha protagonista (when)', () => {
  it('culto: fecha y hora en piezas, con los mismos campos que su fila', () => {
    const n = normalizeAnnouncement('culto', NORMAL.culto, nctx)
    expect(n.when).toMatchObject({ fieldKeys: ['fecha', 'hora'], weekday: 'SÁBADO', day: '7', month: 'NOVIEMBRE' })
    expect(n.when!.time).toMatch(/^7:00\sp\.\sm\.$/)
    expect(detailRows(n).some((r) => r.fieldKeys.includes('fecha'))).toBe(false)
    expect(detailRows(n)).toHaveLength(n.rows.length - 1)
  })

  it('aviso sin fecha → sin when; detailRows = todas las filas', () => {
    const n = normalizeAnnouncement('aviso', NORMAL.aviso, nctx)
    expect(n.when).toBeUndefined()
    expect(detailRows(n)).toEqual(n.rows)
  })
})

describe('layout de la Clásica', () => {
  const opts = { x: 800, width: 1024, bottom: 1000, marker: 56, markerGap: 28 }

  it('apila desde abajo, sin solaparse, dentro del área segura y con slots válidos', () => {
    const n = normalizeAnnouncement('salida', FULL.salida, nctx)
    const { rows, top } = stackRows(detailRows(n), opts)
    expect(rows.at(-1)!.slot.box.y + rows.at(-1)!.slot.box.height).toBe(1000)
    expect(rows[0]!.slot.box.y).toBe(top)
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.slot.box.y).toBeGreaterThan(rows[i - 1]!.slot.box.y + rows[i - 1]!.slot.box.height - 1)
    for (const r of rows) {
      expect(isInsideSafeArea(r.slot.box)).toBe(true)
      expect(() => validateTextSlot(r.slot)).not.toThrow()
    }
  })

  it('una descripción corta reserva una línea; una larga, dos', () => {
    const corta = { fieldKeys: ['d'], text: 'Canto y poesía', role: 'secondary' as const }
    const larga = { ...corta, text: 'Fíate de Jehová de todo tu corazón y no te apoyes en tu propia prudencia. Proverbios 3:5' }
    expect(rowLines(corta, 940, 4)).toBe(1)
    expect(rowLines(larga, 940, 4)).toBe(2)
    // Con pocas filas, el mensaje de un aviso puede usar tres.
    expect(rowLines({ ...larga, text: larga.text.repeat(2) }, 940, 1)).toBe(3)
  })

  it('el título usa tantas líneas como quepan al mínimo, hasta 4', () => {
    expect(titleSlot('titulo', { x: 96, y: 96, width: 800, height: 100 }).maxLines).toBe(1)
    expect(titleSlot('titulo', { x: 96, y: 96, width: 800, height: 900 }).maxLines).toBe(4)
  })
})

describe('logos (RF-37, v1.4)', () => {
  it('varios: un grupo por ministerio, en orden, sin repetidos, como mucho 3', () => {
    const groups = logoGroupFor({ kind: 'varios', ministryIds: ['jovenes', 'jovenes', 'mujer', CHURCH_MINISTRY_ID, 'otro'] }, TEST_MINISTRIES)
    expect(groups).toHaveLength(3)
    expect(groups[0]!.every((c) => c.id.includes('MJ'))).toBe(true)
  })

  it('isotipo → solo variantes cuadradas si las hay; si no, todas', () => {
    const [jovenes, iglesia] = logoGroupFor({ kind: 'varios', ministryIds: ['jovenes', CHURCH_MINISTRY_ID], form: 'isotipo' }, TEST_MINISTRIES)
    expect(jovenes!.every((c) => c.orientation === 'cuadrado')).toBe(true)
    expect(iglesia).toHaveLength(4)
    const [logotipo] = logoGroupFor({ kind: 'ministerio', ministryId: 'jovenes', form: 'logotipo' }, TEST_MINISTRIES)
    expect(logotipo!.every((c) => c.orientation === 'horizontal')).toBe(true)
  })

  it('ninguno o ministerio inexistente → sin grupos', () => {
    expect(logoGroupFor({ kind: 'ninguno' }, TEST_MINISTRIES)).toEqual([])
    expect(logoGroupFor({ kind: 'ministerio', ministryId: 'no-existe' }, TEST_MINISTRIES)).toEqual([])
  })
})

describe('estilos de slide (§9)', () => {
  it('el anuncio usa su estilo; si no tiene, el de Configuración', () => {
    const ctx = makeCtx({ settings: { ...makeCtx().settings, slideStyle: 'cartel' } })
    const base = { typeId: 'culto', templateId: 'clasica', values: NORMAL.culto, logo: { kind: 'iglesia' } as const }
    expect(buildSlides(base, ctx)[0]).toMatchObject({ slideStyle: 'cartel' })
    expect(buildSlides({ ...base, slideStyle: 'himnario' }, ctx)[0]).toMatchObject({ slideStyle: 'himnario' })
    expect(DEFAULT_SLIDE_STYLE).toBe('almanaque')
  })
})
