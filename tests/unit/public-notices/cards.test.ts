// Tarjetas de la página pública (P9, RF-70): título y datos con su ícono, numeradas; la fecha siempre
// larga y sin "hoy/mañana" (la página guardada se lee días después). Un dato raro omite solo ese anuncio.
import { describe, expect, it } from 'vitest'
import { noticeCards, stateLabel } from '../../../src/public-notices/cards'
import type { PublicNotice, PublicNoticesData } from '../../../src/public-notices/types'

const notice = (id: string, typeId: string, values: Record<string, unknown>): PublicNotice => ({
  id,
  typeId,
  values,
  eventDate: null,
  updatedAt: '2026-11-04T10:00:00Z',
})
const data = (notices: PublicNotice[], settings: PublicNoticesData['settings'] = {}): PublicNoticesData => ({ today: '2026-11-05', settings, notices })

describe('noticeCards', () => {
  it('un culto da título y filas de fecha, hora y lugar con sus íconos', () => {
    const [card] = noticeCards(
      data([notice('c1', 'culto', { titulo: 'Santa Cena', fecha: '2026-11-07', hora: '19:00', lugar: 'Templo' })], { timeFormat: '24h', dateStyle: 'corto' }),
    )
    expect(card).toMatchObject({ id: 'c1', number: 1, typeId: 'culto', title: 'Santa Cena' })
    expect(card!.typeName).toBe('Culto')
    expect(card!.rows).toEqual([
      { icon: 'calendar', text: 'Sábado 7 de noviembre' },
      { icon: 'clock', text: '19:00' },
      { icon: 'map-pin', text: 'Templo' },
    ])
  })

  it('el precio usa la moneda de la configuración', () => {
    const [card] = noticeCards(data([notice('s1', 'salida', { titulo: 'Playa', fecha: '2026-11-15', hora: '06:30', destino: 'Najayo', precio: 500 })], { currency: 'DOP' }))
    expect(card!.rows.find((r) => r.icon === 'banknote')!.text).toContain('500')
  })

  it('numera seguido y omite un tipo desconocido o cumpleaños', () => {
    const cards = noticeCards(
      data([
        notice('a', 'aviso', { titulo: 'Uno' }),
        notice('x', 'tipo_del_futuro', { titulo: 'Raro' }),
        notice('b', 'cumpleanos', { personas: [] }),
        notice('c', 'aviso', { titulo: 'Dos' }),
      ]),
    )
    expect(cards.map((c) => [c.number, c.title])).toEqual([
      [1, 'Uno'],
      [2, 'Dos'],
    ])
  })

  it('un anuncio que hace lanzar a normalize se omite', () => {
    const cards = noticeCards(data([notice('a', 'culto', { titulo: 'Malo', fecha: 42, hora: {} }), notice('b', 'aviso', { titulo: 'Bueno' })]))
    expect(cards.map((c) => c.title)).toEqual(['Bueno'])
  })

  it('sin título usa el nombre del tipo', () => {
    expect(noticeCards(data([notice('a', 'aviso', {})]))[0]!.title).toBe('Aviso breve')
  })
})

describe('stateLabel', () => {
  const at = '2026-11-05T14:15:00.000Z'
  it('fresh y cached', () => {
    expect(stateLabel({ kind: 'fresh', data: data([]), savedAt: at })).toMatch(/^Actualizado el jueves, 5 de noviembre|^Actualizado el jueves 5 de noviembre/)
    expect(stateLabel({ kind: 'cached', data: data([]), savedAt: at })).toMatch(/^Sin conexión · guardado el jueves/)
    expect(stateLabel({ kind: 'cached', data: data([]), savedAt: at })).toContain('10:15')
  })
  it('offline y error no tienen etiqueta', () => {
    expect(stateLabel({ kind: 'offline' })).toBeNull()
    expect(stateLabel({ kind: 'error' })).toBeNull()
  })
})
