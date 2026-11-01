import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, formatTime, parseLocalDate } from '../../../src/lib/format'

const HOY = new Date(2026, 10, 1) // 1 de noviembre de 2026

describe('formatDate', () => {
  it('la zona horaria de las pruebas es la de RD (UTC−4)', () => {
    expect(new Date(2026, 10, 7).getTimezoneOffset()).toBe(240)
  })

  it('fecha larga sin año en el año actual (no se corre un día por UTC)', () => {
    expect(formatDate('2026-11-07', { today: HOY })).toBe('Sábado 7 de noviembre')
    expect(formatDate('2026-12-31', { today: HOY })).toBe('Jueves 31 de diciembre')
  })

  it('agrega el año si no es el actual', () => {
    expect(formatDate('2027-01-02', { today: HOY })).toBe('Sábado 2 de enero de 2027')
  })
})

describe('parseLocalDate', () => {
  it('medianoche local', () => {
    const d = parseLocalDate('2026-11-07')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 10, 7, 0])
  })

  it.each(['2026-02-30', '2026-13-01', '07/11/2026', '', '2026-1-7'])('rechaza %j', (malo) => {
    expect(() => parseLocalDate(malo)).toThrow(RangeError)
  })
})

describe('formatTime', () => {
  it.each([
    ['19:00', '7:00 p. m.'],
    ['07:30', '7:30 a. m.'],
    ['00:00', '12:00 a. m.'],
    ['12:00', '12:00 p. m.'],
  ])('formatTime(%s) → %s', (h, esperado) => {
    expect(formatTime(h)).toBe(esperado)
  })

  it('formato 24 h', () => {
    expect(formatTime('19:05', { timeFormat: '24h' })).toBe('19:05')
  })

  it.each(['24:00', '7:00', '19:60', ''])('rechaza %j', (malo) => {
    expect(() => formatTime(malo)).toThrow(RangeError)
  })
})

describe('formatMoney', () => {
  it.each([
    [500, 'RD$500'],
    [1500, 'RD$1,500'],
    [1500.5, 'RD$1,500.50'],
    [0, 'Gratis'],
  ])('formatMoney(%d) → %s', (n, esperado) => {
    expect(formatMoney(n)).toBe(esperado)
  })
})
