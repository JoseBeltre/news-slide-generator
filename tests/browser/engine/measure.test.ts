import { beforeAll, describe, expect, it } from 'vitest'
import {
  FontNotLoadedError,
  ensureFontLoaded,
  measureTextFit,
  normalizeSlotText,
} from '../../../src/slides/engine/measure'
import type { TextSlotDef } from '../../../src/slides/engine/types'

const F = 'Atkinson Hyperlegible'
beforeAll(() => ensureFontLoaded(F))

const titulo: TextSlotDef = {
  id: 'titulo',
  role: 'title',
  fieldKey: 'titulo',
  box: { x: 96, y: 64, width: 1728, height: 400 },
}

describe('normalizeSlotText', () => {
  it('recorta, colapsa espacios y conserva un salto de línea', () => {
    expect(normalizeSlotText('  Hola   mundo\t!  ')).toBe('Hola mundo !')
    expect(normalizeSlotText('Uno\n\n\nDos')).toBe('Uno\nDos')
    expect(normalizeSlotText('Uno  \n  Dos')).toBe('Uno\nDos')
  })
})

describe('measureTextFit', () => {
  it('un título corto cabe al tamaño máximo en una línea', () => {
    expect(measureTextFit('Culto de Jóvenes', titulo, { fontFamily: F })).toEqual({
      status: 'fits',
      fontSize: 150,
      lines: 1,
      belowPreferred: false,
    })
  })

  it('un título de 60 palabras no cabe y reporta el mínimo', () => {
    const largo = Array.from({ length: 60 }, (_, i) => `palabra${i}`).join(' ')
    expect(measureTextFit(largo, titulo, { fontFamily: F })).toEqual({ status: 'too_long', minFontSize: 96 })
  })

  it('cuando cabe, nunca está por debajo del mínimo del rol', () => {
    const textos = ['Ayuno', 'Semana de oración por la familia', 'Campamento de Conquistadores en Jarabacoa 2026']
    for (const t of textos) {
      const r = measureTextFit(t, titulo, { fontFamily: F })
      if (r.status === 'fits') expect(r.fontSize).toBeGreaterThanOrEqual(96)
    }
  })

  it.each(['Otorrinolaringología', '809-555-1234'])('palabra sin cortes "%s" en slot estrecho', (txt) => {
    const estrecho: TextSlotDef = { id: 's', role: 'secondary', box: { x: 96, y: 64, width: 420, height: 400 } }
    const r = measureTextFit(txt, estrecho, { fontFamily: F })
    if (r.status === 'fits') {
      expect(r.lines).toBe(1)
      expect(r.fontSize).toBeGreaterThanOrEqual(52)
    } else {
      expect(r).toEqual({ status: 'too_long', minFontSize: 52 })
    }
  })

  it('una palabra que no entra en el ancho ni al mínimo → too_long (nunca se parte)', () => {
    const muyEstrecho: TextSlotDef = { id: 's', role: 'secondary', box: { x: 96, y: 64, width: 200, height: 400 } }
    expect(measureTextFit('Otorrinolaringología', muyEstrecho, { fontFamily: F })).toEqual({
      status: 'too_long',
      minFontSize: 52,
    })
  })

  it('maxLines: 1 reduce el tamaño en lugar de partir en dos líneas', () => {
    // a 150 px no entra en 1728 de ancho en una línea; a 96 px sí
    const unaLinea: TextSlotDef = { ...titulo, maxLines: 1 }
    const r = measureTextFit('Campamento de Conquistadores', unaLinea, { fontFamily: F })
    expect(r.status).toBe('fits')
    if (r.status === 'fits') {
      expect(r.lines).toBe(1)
      expect(r.fontSize).toBeLessThan(150)
    }
  })

  it('las mayúsculas ocupan más: el tamaño resultante es menor que sin ellas', () => {
    const base: TextSlotDef = { ...titulo, box: { ...titulo.box, width: 1400 }, maxLines: 1 }
    const normal = measureTextFit('Gran Culto Especial', base, { fontFamily: F })
    const mayus = measureTextFit('Gran Culto Especial', { ...base, uppercase: true }, { fontFamily: F })
    expect(normal.status).toBe('fits')
    expect(mayus.status).toBe('fits')
    if (normal.status === 'fits' && mayus.status === 'fits') expect(mayus.fontSize).toBeLessThan(normal.fontSize)
  })

  it('respeta los saltos de línea del usuario', () => {
    const r = measureTextFit('Línea uno\nLínea dos', { ...titulo, role: 'secondary' }, { fontFamily: F })
    expect(r.status === 'fits' && r.lines >= 2).toBe(true)
  })

  it('belowPreferred cuando el tamaño queda entre el mínimo y el preferido', () => {
    const r = measureTextFit('Campamento de Conquistadores', { ...titulo, maxLines: 1 }, { fontFamily: F })
    expect(r.status === 'fits' && r.belowPreferred === r.fontSize < 120).toBe(true)
  })

  it.each(['', '   ', '\n\t '])('texto vacío %j → empty', (t) => {
    expect(measureTextFit(t, titulo, { fontFamily: F })).toEqual({ status: 'empty' })
  })

  it('determinista', () => {
    expect(measureTextFit('Salida a la playa', titulo, { fontFamily: F })).toEqual(
      measureTextFit('Salida a la playa', titulo, { fontFamily: F }),
    )
  })

  it('no deja nodos de medición visibles en la página', () => {
    measureTextFit('Hola', titulo, { fontFamily: F })
    const hosts = document.querySelectorAll('[data-measure-host]')
    expect(hosts.length).toBe(1)
    expect(getComputedStyle(hosts[0]!).visibility).toBe('hidden')
  })
})

describe('fuente no cargada', () => {
  it('ensureFontLoaded rechaza una fuente inexistente', async () => {
    await expect(ensureFontLoaded('NoExiste')).rejects.toBeInstanceOf(FontNotLoadedError)
  })

  it('measureTextFit no mide con una fuente que no pasó por ensureFontLoaded', () => {
    expect(() => measureTextFit('Hola', titulo, { fontFamily: 'NoExiste' })).toThrow(FontNotLoadedError)
    expect(() => measureTextFit('Hola', titulo, { fontFamily: 'Otra Fuente' })).toThrow(FontNotLoadedError)
  })
})
