import { describe, expect, it } from 'vitest'
import { normalizeAnnouncement } from '../../../src/slides/normalize'
import { FORTY_ONE_WORDS, FULL, MINIMAL, NORMAL, TEXT_TYPE_IDS } from '../../fixtures/announcements'

const ctx = { today: '2026-11-01', reference: '2026-11-01' }
const row = (n: ReturnType<typeof normalizeAnnouncement>, key: string) => n.rows.find((r) => r.fieldKeys[0] === key)

describe('normalizeAnnouncement', () => {
  it('culto: título, fecha y hora en una fila, lugar con su ícono', () => {
    const n = normalizeAnnouncement('culto', NORMAL.culto, ctx)
    expect(n.title).toEqual({ fieldKey: 'titulo', text: 'Semana de oración' })
    expect(n.rows[0]).toEqual({
      fieldKeys: ['fecha', 'hora'],
      icon: 'calendar',
      text: 'Sábado 7 de noviembre · 7:00 p. m.',
      role: 'key',
    })
    expect(row(n, 'lugar')).toMatchObject({ icon: 'map-pin', text: 'Templo central' })
    expect(n.density).toEqual({ status: 'ok' })
  })

  it('precio 0 → "Gratis"; lista y fecha límite con su prefijo', () => {
    expect(row(normalizeAnnouncement('actividad', NORMAL.actividad, ctx), 'precio')?.text).toBe('Gratis')
    const s = normalizeAnnouncement('salida', FULL.salida, ctx)
    expect(row(s, 'queLlevar')?.text).toBe('Llevar: Agua, Gorra, Merienda')
    expect(row(s, 'fechaLimite')?.text).toBe('Hasta el domingo 8 de noviembre')
  })

  it('estilo corto con relativas: ESTA NOCHE y hora en mayúsculas', () => {
    const n = normalizeAnnouncement('culto', NORMAL.culto, {
      ...ctx,
      reference: '2026-11-07',
      dateStyle: 'corto',
      relativeDates: true,
    })
    expect(n.rows[0]!.text).toBe('ESTA NOCHE · 7:00 P. M.')
  })

  it('presenter-only e imágenes no son filas; imageId toma la primera imagen', () => {
    const n = normalizeAnnouncement('culto', { ...NORMAL.culto, fotoPredicador: 'img-1' }, ctx)
    expect(n.rows.some((r) => r.fieldKeys.includes('fotoPredicador'))).toBe(false)
    expect(n).toMatchObject({ imageFieldKey: 'fotoPredicador', imageId: 'img-1' })
  })

  it('opcionales vacíos no generan filas', () => {
    for (const t of TEXT_TYPE_IDS) {
      for (const r of normalizeAnnouncement(t, MINIMAL[t], ctx).rows) expect(r.text.trim(), t).not.toBe('')
    }
    expect(normalizeAnnouncement('culto', MINIMAL.culto, ctx).rows).toHaveLength(1)
    expect(normalizeAnnouncement('culto', { ...MINIMAL.culto, lugar: '   ' }, ctx).rows).toHaveLength(1)
  })

  it('salida llena: 7 filas → no cabe por densidad en el último campo', () => {
    const n = normalizeAnnouncement('salida', FULL.salida, ctx)
    expect(n.rows).toHaveLength(7)
    expect(n.density).toEqual({ status: 'no_cabe', code: 'too_many_lines', fieldKey: 'contacto' })
  })

  it('aviso con 41 palabras → too_many_words en mensaje', () => {
    const n = normalizeAnnouncement('aviso', { titulo: 'Aviso', mensaje: FORTY_ONE_WORDS }, ctx)
    expect(n.density).toEqual({ status: 'no_cabe', code: 'too_many_words', fieldKey: 'mensaje' })
  })

  it('cumpleaños e imagen tienen su propio layout', () => {
    expect(() => normalizeAnnouncement('cumpleanos', {}, ctx)).toThrow()
    expect(() => normalizeAnnouncement('imagen', {}, ctx)).toThrow()
  })
})
