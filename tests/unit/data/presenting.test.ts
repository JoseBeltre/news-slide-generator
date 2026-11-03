import { describe, expect, it } from 'vitest'
import type { Announcement } from '../../../src/data/models'
import { INITIAL_STATE, apply, commandForKey, keyPoints, type PresenterState } from '../../../src/data/presenting'
import { presentationSlides } from '../../../src/data/presentations'
import { NORMAL } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'

const s = (over: Partial<PresenterState> = {}): PresenterState => ({ ...INITIAL_STATE, ...over })

describe('apply (RF-62)', () => {
  it('índices acotados', () => {
    expect(apply(s({ index: 4 }), { type: 'next' }, 5).index).toBe(4)
    expect(apply(s(), { type: 'prev' }, 5).index).toBe(0)
    expect(apply(s(), { type: 'goto', index: 99 }, 5).index).toBe(4)
    expect(apply(s({ index: 2 }), { type: 'goto', index: -1 }, 5).index).toBe(0)
    expect(apply(s({ index: 3 }), { type: 'next' }, 0).index).toBe(0)
    expect(apply(s({ index: 1 }), { type: 'first' }, 5).index).toBe(0)
    expect(apply(s(), { type: 'last' }, 5).index).toBe(4)
  })

  it('negro y logo alternan y se excluyen; moverse los quita', () => {
    const black = apply(s(), { type: 'black' }, 5)
    expect(black).toEqual(s({ black: true }))
    expect(apply(black, { type: 'black' }, 5).black).toBe(false)
    expect(apply(black, { type: 'logo' }, 5)).toEqual(s({ logo: true }))
    expect(apply(black, { type: 'next' }, 5)).toEqual(s({ index: 1 }))
    expect(apply(s({ index: 2, logo: true }), { type: 'exit' }, 5)).toEqual(s({ index: 2, logo: true }))
  })
})

describe('commandForKey (RF-64)', () => {
  const k = (key: string, mods: Partial<{ ctrlKey: boolean; altKey: boolean; metaKey: boolean }> = {}, inField = false) =>
    commandForKey({ key, ctrlKey: false, altKey: false, metaKey: false, ...mods }, inField)

  it('las teclas del SRS y L', () => {
    for (const key of ['ArrowRight', 'ArrowDown', ' ', 'PageDown']) expect(k(key)).toEqual({ type: 'next' })
    for (const key of ['ArrowLeft', 'ArrowUp', 'PageUp']) expect(k(key)).toEqual({ type: 'prev' })
    expect(k('Home')).toEqual({ type: 'first' })
    expect(k('End')).toEqual({ type: 'last' })
    expect(k('b')).toEqual({ type: 'black' })
    expect(k('B')).toEqual({ type: 'black' })
    expect(k('l')).toEqual({ type: 'logo' })
    expect(k('L')).toEqual({ type: 'logo' })
    expect(k('Escape')).toEqual({ type: 'exit' })
  })

  it('con modificadores, en un campo (salvo Esc) o desconocida → nada', () => {
    expect(k('ArrowRight', { ctrlKey: true })).toBeUndefined()
    expect(k('b', { altKey: true })).toBeUndefined()
    expect(k('ArrowRight', { metaKey: true })).toBeUndefined()
    expect(k('ArrowRight', {}, true)).toBeUndefined()
    expect(k('Escape', {}, true)).toEqual({ type: 'exit' })
    expect(k('x')).toBeUndefined()
  })
})

describe('keyPoints (RF-63)', () => {
  const ctx = makeCtx()
  const base = { updatedAt: '', createdAt: '', imageIds: [], logo: { kind: 'iglesia' as const }, status: 'listo' as const }
  const culto: Announcement = { ...base, id: 'c', typeId: 'culto', templateId: 'clasica', values: { ...NORMAL.culto }, presenterNotes: 'Invitar a todos' }
  const personas = Array.from({ length: 10 }, (_, i) => ({ name: `Persona ${i + 1}`, day: 1 + i, month: 11 }))
  const cumple: Announcement = { ...base, id: 'g', typeId: 'cumpleanos', templateId: 'cumpleanos', values: { modo: 'grupo', personas } }
  const byId = new Map([culto, cumple].map((a) => [a.id, a]))
  const slides = presentationSlides(
    { id: 'p', updatedAt: '', date: '2026-11-07', items: [{ announcementId: 'c' }, { announcementId: 'g' }], showCover: true, showClosing: false, published: false },
    byId,
    ctx,
  )

  it('anuncio: título, filas clave y notas', () => {
    const k = keyPoints(slides[1], byId)
    const spec = slides[1]!.spec
    if (spec.kind !== 'announcement') throw new Error('se esperaba anuncio')
    expect(k.heading).toBe('Semana de oración')
    expect(k.label).toBe('Culto / Servicio especial')
    expect(k.lines).toEqual(spec.data.rows.filter((r) => r.role === 'key').map((r) => r.text))
    expect(k.lines.join(' ')).toContain('7:00')
    expect(k.notes).toBe('Invitar a todos')
  })

  it('cumpleaños en grupo paginado: sus nombres y "(2/2)"', () => {
    const pages = slides.filter((x) => x.spec.kind === 'birthday-group')
    expect(pages).toHaveLength(2)
    const k = keyPoints(pages[1], byId)
    expect(k.label).toBe('Cumpleaños (2/2)')
    const spec = pages[1]!.spec
    if (spec.kind !== 'birthday-group') throw new Error('se esperaba grupo')
    expect(k.lines).toEqual(spec.people.map((p) => p.name))
  })

  it('portada sin notas; sin slide → "Sin slides"', () => {
    expect(keyPoints(slides[0], byId)).toEqual({ heading: 'Portada', label: 'Portada', lines: [] })
    expect(keyPoints(undefined, byId)).toEqual({ heading: 'Sin slides', label: '', lines: [] })
  })
})
