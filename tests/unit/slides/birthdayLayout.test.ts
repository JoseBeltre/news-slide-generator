import { describe, expect, it } from 'vitest'
import { birthdayLayout, type BirthdayPage } from '../../../src/slides/templates/birthday/layout'
import type { Person } from '../../../src/slides/types/validation'
import { buildSlides, templatesFor } from '../../../src/slides/templates/registry'
import { makeCtx } from '../../fixtures/context'

const p = (name: string, day: number, month: number, photoId?: string): Person => ({ name, day, month, ...(photoId ? { photoId } : {}) })
const ctx = { referenceDate: '2026-11-07', defaultMessage: '¡Feliz cumpleaños!' }
const names = (pages: BirthdayPage[]) => pages.map((s) => (s.kind === 'birthday-single' ? s.person.name : s.people.map((x) => x.name).join(',')))
const nadie = (n: number) => Array.from({ length: n }, (_, i) => p(`Persona ${i + 1}`, 1 + i, 11))

describe('birthdayLayout (RF-21, RF-25, RF-26)', () => {
  it('ordena por cercanía a la fecha de la presentación, cruzando el año', () => {
    const personas = [p('Dos de enero', 2, 1), p('Treinta de diciembre', 30, 12), p('Primero de enero', 1, 1)]
    const pages = birthdayLayout({ modo: 'individual', personas }, { ...ctx, referenceDate: '2027-01-01' })
    expect(names(pages)).toEqual(['Treinta de diciembre', 'Primero de enero', 'Dos de enero'])
  })

  it('individual con 3 personas → 3 slides individuales, sin paginación', () => {
    const pages = birthdayLayout({ modo: 'individual', personas: nadie(3) }, ctx)
    expect(pages.map((s) => s.kind)).toEqual(['birthday-single', 'birthday-single', 'birthday-single'])
    expect(pages.every((s) => !('page' in s) || s.page === undefined)).toBe(true)
  })

  it('grupo con 9 sin foto → 8 + 1, con "(1/2)" y "(2/2)"', () => {
    const pages = birthdayLayout({ modo: 'grupo', personas: nadie(9) }, ctx)
    expect(pages.map((s) => (s.kind === 'birthday-group' ? [s.people.length, s.page] : null))).toEqual([
      [8, [1, 2]],
      [1, [2, 2]],
    ])
  })

  it('grupo con 7 y una foto → 6 + 1 (con fotos caben 6)', () => {
    const personas = nadie(7)
    personas[3] = { ...personas[3]!, photoId: 'foto' }
    const pages = birthdayLayout({ modo: 'grupo', personas }, ctx)
    expect(pages.map((s) => (s.kind === 'birthday-group' ? s.people.length : 0))).toEqual([6, 1])
  })

  it('grupo que cabe en una slide → sin paginación', () => {
    const [page] = birthdayLayout({ modo: 'grupo', personas: nadie(4) }, ctx)
    expect(page!.kind === 'birthday-group' && page!.page).toBeUndefined()
  })

  it('híbrido: con foto → individuales; sin foto → un grupo', () => {
    const personas = [p('Ana', 5, 11, 'a'), p('Beto', 6, 11), p('Carla', 7, 11, 'c'), p('Dani', 8, 11), p('Eva', 9, 11)]
    const pages = birthdayLayout({ modo: 'hibrido', personas }, ctx)
    expect(pages.map((s) => s.kind)).toEqual(['birthday-single', 'birthday-single', 'birthday-group'])
    expect(names(pages)).toEqual(['Ana', 'Carla', 'Beto,Dani,Eva'])
    expect(birthdayLayout({ modo: 'hibrido', personas: personas.filter((x) => x.photoId) }, ctx).every((s) => s.kind === 'birthday-single')).toBe(true)
    expect(birthdayLayout({ modo: 'hibrido', personas: personas.filter((x) => !x.photoId) }, ctx).map((s) => s.kind)).toEqual(['birthday-group'])
  })

  it('mensaje vacío → el mensaje por defecto; nunca año ni edad', () => {
    const pages = birthdayLayout({ modo: 'individual', personas: [p('Ana', 7, 11)], mensaje: '  ' }, ctx)
    const single = pages[0]!
    expect(single.kind === 'birthday-single' && single.message).toBe('¡Feliz cumpleaños!')
    expect(single.kind === 'birthday-single' && single.dayText).toBe('7 de noviembre')
    expect(JSON.stringify(pages)).not.toMatch(/20\d\d|\d+ años/)
  })

  it('el versículo solo va en las individuales', () => {
    const pages = birthdayLayout({ modo: 'hibrido', personas: [p('Ana', 7, 11, 'a'), p('Beto', 8, 11)], versiculo: 'Salmo 90:12' }, ctx)
    expect(pages[0]!.kind === 'birthday-single' && pages[0]!.verse).toBe('Salmo 90:12')
    expect('verse' in pages[1]!).toBe(false)
  })
})

describe('registro de cumpleaños', () => {
  it('cumpleaños tiene su propia plantilla; buildSlides añade paleta, logo y estilo', () => {
    expect(templatesFor('cumpleanos').map((t) => t.id)).toEqual(['cumpleanos'])
    const slides = buildSlides(
      { typeId: 'cumpleanos', templateId: 'cumpleanos', values: { modo: 'grupo', personas: nadie(2) }, logo: { kind: 'iglesia' }, slideStyle: 'cartel' },
      makeCtx(),
    )
    expect(slides).toHaveLength(1)
    expect(slides[0]).toMatchObject({ kind: 'birthday-group', slideStyle: 'cartel', logo: { kind: 'iglesia' } })
    expect('palette' in slides[0]! && slides[0]!.palette.background.length).toBeGreaterThan(0)
  })
})
