import { describe, expect, it } from 'vitest'
import {
  displayTitle,
  draftFrom,
  duplicate,
  eventDateOf,
  filterAnnouncements,
  isPast,
  statusFor,
} from '../../../src/data/announcements'
import type { Announcement } from '../../../src/data/models'
import { DEFAULT_SETTINGS, SETTINGS_ID } from '../../../src/data/settings'

const TODAY = '2026-11-01'
const SETTINGS = { ...DEFAULT_SETTINGS, id: SETTINGS_ID, updatedAt: '2026-11-01T00:00:00Z' }

function ann(id: string, typeId: string, eventDate?: string, values: Record<string, unknown> = {}): Announcement {
  return {
    id,
    typeId,
    templateId: 'clasica',
    logo: { kind: 'iglesia' },
    values: { titulo: id, ...values },
    imageIds: [],
    eventDate,
    status: 'listo',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  }
}

describe('fecha del evento y pasados (RF-07)', () => {
  it('isPast: antes de hoy sí; hoy y sin fecha no', () => {
    expect(isPast({ eventDate: '2026-10-31' }, TODAY)).toBe(true)
    expect(isPast({ eventDate: TODAY }, TODAY)).toBe(false)
    expect(isPast({ eventDate: undefined }, TODAY)).toBe(false)
  })

  it('eventDateOf toma la fecha del tipo; sin fecha → undefined', () => {
    expect(eventDateOf('culto', { fecha: '2026-11-07' })).toBe('2026-11-07')
    expect(eventDateOf('aviso', {})).toBeUndefined()
    expect(eventDateOf('cumpleanos', { personas: [] })).toBeUndefined()
    expect(eventDateOf('culto', { fecha: '' })).toBeUndefined()
  })
})

describe('filterAnnouncements (RF-08)', () => {
  const list = [
    ann('aviso', 'aviso'),
    ann('sabado', 'culto', '2026-11-07'),
    ann('pasado', 'culto', '2026-10-20'),
    ann('hoy', 'actividad', TODAY),
    ann('muyPasado', 'actividad', '2026-09-01'),
  ]

  it('activos: sin pasados, por fecha ascendente y los sin fecha al final', () => {
    expect(filterAnnouncements(list, { view: 'activos', today: TODAY }).map((a) => a.id)).toEqual(['hoy', 'sabado', 'aviso'])
  })

  it('pasados: por fecha descendente', () => {
    expect(filterAnnouncements(list, { view: 'pasados', today: TODAY }).map((a) => a.id)).toEqual(['pasado', 'muyPasado'])
  })

  it('filtra por tipo', () => {
    expect(filterAnnouncements(list, { view: 'activos', typeId: 'culto', today: TODAY }).map((a) => a.id)).toEqual(['sabado'])
  })
})

describe('borrador, duplicar y estado', () => {
  it('draftFrom trae los valores por defecto, la plantilla del tipo y el logo de la iglesia', () => {
    const d = draftFrom('cumpleanos', SETTINGS)
    expect(d.values).toMatchObject({ modo: 'individual', mostrarDia: 'si', mensaje: '¡Feliz cumpleaños!' })
    expect(d).toMatchObject({ typeId: 'cumpleanos', templateId: 'cumpleanos', logo: { kind: 'iglesia' }, status: 'borrador', imageIds: [] })
    expect(d.id).toBeUndefined()
    expect(d.slideStyle).toBeUndefined()
    expect(draftFrom('cumpleanos', { ...SETTINGS, birthdayDefaultMessage: '¡Bendiciones!' }).values.mensaje).toBe('¡Bendiciones!')
  })

  it('duplicate: sin id, borrador, createdAt nuevo y valores copiados en profundidad (RF-02)', () => {
    const original = ann('a', 'salida', '2026-11-07', { queLlevar: ['Agua'] })
    const copy = duplicate(original, '2026-11-01T10:00:00Z')
    expect(copy.id).toBeUndefined()
    expect(copy).toMatchObject({ status: 'borrador', createdAt: '2026-11-01T10:00:00Z', typeId: 'salida' })
    expect('deletedAt' in copy).toBe(false)
    ;(copy.values.queLlevar as string[]).push('Gorra')
    expect(original.values.queLlevar).toEqual(['Agua'])
  })

  it('statusFor: inválido → borrador; no_cabe → no_cabe; ok → listo; midiendo lanza', () => {
    expect(statusFor(false, 'ok')).toBe('borrador')
    expect(statusFor(true, 'no_cabe')).toBe('no_cabe')
    expect(statusFor(true, 'ok')).toBe('listo')
    expect(() => statusFor(true, 'midiendo')).toThrow()
  })

  it('displayTitle: título, título interno o nombres; nunca "undefined"', () => {
    expect(displayTitle({ typeId: 'culto', values: { titulo: 'Culto joven' } })).toBe('Culto joven')
    expect(displayTitle({ typeId: 'aviso', values: {} })).toBeUndefined()
    expect(displayTitle({ typeId: 'imagen', values: { tituloInterno: 'Flyer campamento' } })).toBe('Flyer campamento')
    const personas = [{ name: 'Ana', day: 3, month: 11 }, { name: 'Luis', day: 9, month: 11 }]
    expect(displayTitle({ typeId: 'cumpleanos', values: { personas } })).toBe('Cumpleaños: Ana, Luis')
  })
})
