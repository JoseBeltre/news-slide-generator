// Barra de navegación inferior y dirección del cambio de página (UI móvil).
import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, navIndexFor, pageDirection, pageKey } from '../../../src/app/navigation'
import { routes } from '../../../src/app/router'

describe('barra inferior', () => {
  it('tiene Inicio, Anuncios, Presentar y Ajustes, en ese orden', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(['Inicio', 'Anuncios', 'Presentar', 'Ajustes'])
  })

  it('cada destino es una ruta que existe', () => {
    const names = routes.map((r) => r.name)
    for (const item of NAV_ITEMS) expect(names).toContain(item.to.name)
  })

  it.each([
    ['inicio', 0],
    ['anuncios', 1],
    ['nuevo', 1],
    ['nuevo-tipo', 1],
    ['editar', 1],
    ['presentaciones', 2],
    ['presentacion', 2],
    ['configuracion', 3],
    ['importar', 0],
  ])('la ruta %s marca el destino %i', (name, index) => {
    expect(navIndexFor(name)).toBe(index)
  })

  it('una ruta sin destino (entrar, presentar) no marca ninguno', () => {
    expect(navIndexFor('entrar')).toBe(-1)
    expect(navIndexFor('presentar')).toBe(-1)
    expect(navIndexFor(undefined)).toBe(-1)
  })
})

describe('dirección del cambio de página', () => {
  it('hacia un destino más a la derecha es adelante (1); a uno de la izquierda, atrás (-1)', () => {
    expect(pageDirection('inicio', 'anuncios')).toBe(1)
    expect(pageDirection('configuracion', 'inicio')).toBe(-1)
    expect(pageDirection('presentaciones', 'anuncios')).toBe(-1)
  })

  it('entrar a un detalle es adelante y volver a su lista es atrás', () => {
    expect(pageDirection('anuncios', 'editar')).toBe(1)
    expect(pageDirection('editar', 'anuncios')).toBe(-1)
    expect(pageDirection('nuevo', 'nuevo-tipo')).toBe(1)
    expect(pageDirection('presentacion', 'presentaciones')).toBe(-1)
  })

  it('la misma pantalla o una desconocida cuenta como adelante', () => {
    expect(pageDirection('inicio', 'inicio')).toBe(1)
    expect(pageDirection(undefined, 'inicio')).toBe(1)
    expect(pageDirection('inicio', 'entrar')).toBe(1)
  })
})

describe('pageKey', () => {
  it('el editor de un anuncio nuevo y el guardado comparten pantalla (guardar no la recarga)', () => {
    expect(pageKey('nuevo-tipo')).toBe(pageKey('editar'))
    expect(pageKey('inicio')).not.toBe(pageKey('anuncios'))
  })
})
