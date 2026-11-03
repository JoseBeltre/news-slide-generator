import { describe, expect, it, vi } from 'vitest'
import { formatDate, formatEventDate, formatMoney, formatTime, parseLocalDate, parseMoneyInput, toIsoDate, type DateStyle } from '../../../src/lib/format'

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

  it('no depende de la versión de ICU del entorno: "p. m." siempre con espacio sin corte', () => {
    // Node en Linux (CI) da "p. m." con espacio normal; Windows y Chrome, con U+00A0.
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function () { return { format: () => '7:00 p. m.' } as unknown as Intl.DateTimeFormat })
    try {
      expect(formatTime('19:00')).toBe('7:00 p. m.')
    } finally {
      spy.mockRestore()
    }
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

describe('formatMoney redondea a centavos (revisión final P2)', () => {
  it('1500.999 → "RD$1,501" y 1500.004 → "RD$1,500", sin ",00"', () => {
    expect(formatMoney(1500.999)).toBe('RD$1,501')
    expect(formatMoney(1500.004)).toBe('RD$1,500')
    expect(formatMoney(0.001)).toBe('Gratis')
  })
})

describe('formatEventDate: estilos (P3 · T1)', () => {
  const ref = '2026-11-01'
  it.each<[DateStyle, string, string]>([
    ['largo', '2026-11-07', 'Sábado 7 de noviembre'],
    ['largo', '2026-12-05', 'Sábado 5 de diciembre'],
    ['largo', '2027-01-02', 'Sábado 2 de enero de 2027'],
    ['medio', '2026-11-07', 'SÁBADO 7 DE NOV'],
    ['medio', '2026-12-05', 'SÁBADO 5 DE DIC'],
    ['medio', '2027-01-02', 'SÁBADO 2 DE ENE 2027'],
    ['corto', '2026-11-07', 'SÁB 7'],
    ['corto', '2026-12-05', 'SÁB 5 DIC'],
    ['corto', '2027-01-02', 'SÁB 2 ENE 2027'],
    ['corto-mes-completo', '2026-11-07', 'SÁB 7'],
    ['corto-mes-completo', '2026-12-05', 'SÁB 5 DICIEMBRE'],
    ['corto-mes-completo', '2027-01-02', 'SÁB 2 ENERO 2027'],
  ])('%s %s → %s', (style, iso, esperado) => {
    expect(formatEventDate(iso, { style, reference: ref })).toBe(esperado)
  })

  it('por defecto es largo, igual que formatDate', () => {
    expect(formatEventDate('2026-11-07', { reference: ref })).toBe('Sábado 7 de noviembre')
  })

  it('septiembre abrevia SEP, nunca SEPT; miércoles lleva tilde', () => {
    expect(formatEventDate('2026-09-02', { style: 'corto', reference: ref })).toBe('MIÉ 2 SEP')
  })
})

describe('formatEventDate: relativas (P3 · T1)', () => {
  const sab = '2026-11-07'
  const rel = (iso: string, time?: string, style: DateStyle = 'corto') =>
    formatEventDate(iso, { style, relative: true, reference: sab, time })

  it('mismo día: ESTA NOCHE desde las 18:00, si no HOY', () => {
    expect(rel(sab, '19:00')).toBe('ESTA NOCHE')
    expect(rel(sab, '18:00')).toBe('ESTA NOCHE')
    expect(rel(sab, '17:59')).toBe('HOY')
    expect(rel(sab)).toBe('HOY')
  })

  it('día siguiente: MAÑANA; ayer: nunca relativa', () => {
    expect(rel('2026-11-08', '10:00')).toBe('MAÑANA')
    expect(rel('2026-11-06')).toBe('VIE 6')
  })

  it('con largo, en tipo oración', () => {
    expect(rel(sab, '19:00', 'largo')).toBe('Esta noche')
    expect(rel(sab, '09:00', 'largo')).toBe('Hoy')
    expect(rel('2026-11-08', undefined, 'largo')).toBe('Mañana')
  })

  it('cruce de año', () => {
    expect(formatEventDate('2027-01-01', { style: 'corto', relative: true, reference: '2026-12-31' })).toBe('MAÑANA')
    expect(formatEventDate('2027-01-01', { style: 'corto', reference: '2026-12-31' })).toBe('VIE 1 ENE 2027')
  })

  it('sin relative, el mismo día no cambia', () => {
    expect(formatEventDate(sab, { style: 'corto', reference: sab, time: '19:00' })).toBe('SÁB 7')
  })
})

describe('toIsoDate', () => {
  it('fecha local → YYYY-MM-DD, sin correrse por UTC', () => {
    expect(toIsoDate(new Date(2026, 10, 7, 23, 30))).toBe('2026-11-07')
    expect(toIsoDate(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01')
  })
})

describe('parseMoneyInput (campo de precio)', () => {
  it('acepta separador de miles y decimales con punto', () => {
    expect(parseMoneyInput('1,500')).toBe(1500)
    expect(parseMoneyInput('1500')).toBe(1500)
    expect(parseMoneyInput(' 2,350.50 ')).toBe(2350.5)
    expect(parseMoneyInput('RD$ 500')).toBe(500)
  })

  it('vacío → undefined; texto que no es número → el texto (la validación lo explica)', () => {
    expect(parseMoneyInput('')).toBeUndefined()
    expect(parseMoneyInput('   ')).toBeUndefined()
    expect(parseMoneyInput('gratis')).toBe('gratis')
  })
})
