import { describe, expect, it } from 'vitest'
import type { Announcement, Presentation } from '../../../src/data/models'
import {
  contentIssues,
  moveItem,
  newPresentation,
  presentationContext,
  nextSaturday,
  presentationSlides,
  suggestedItems,
} from '../../../src/data/presentations'
import type { SlideSpec } from '../../../src/slides/templates/contract'
import { NORMAL } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'

let n = 0
const ann = (over: Partial<Announcement> = {}): Announcement => ({
  id: `a${++n}`,
  updatedAt: '2026-11-01T00:00:00.000Z',
  createdAt: '2026-11-01T00:00:00.000Z',
  typeId: 'culto',
  templateId: 'clasica',
  values: { ...NORMAL.culto },
  imageIds: [],
  logo: { kind: 'iglesia' },
  status: 'listo',
  eventDate: '2026-11-07',
  ...over,
})
const pres = (over: Partial<Presentation> = {}): Presentation => ({
  id: 'p1',
  updatedAt: '2026-11-01T00:00:00.000Z',
  date: '2026-11-07',
  items: [],
  showCover: true,
  showClosing: true,
  published: false,
  ...over,
})
const index = (...list: Announcement[]) => new Map(list.map((a) => [a.id, a]))

describe('nextSaturday (RF-50)', () => {
  it('el próximo sábado, u hoy si es sábado, cruzando el año', () => {
    expect(nextSaturday('2026-11-02')).toBe('2026-11-07')
    expect(nextSaturday('2026-11-07')).toBe('2026-11-07')
    expect(nextSaturday('2026-12-27')).toBe('2027-01-02')
  })
})

describe('suggestedItems (RF-52)', () => {
  it('listos, no borrados, con fecha ≥ la de la presentación, por fecha', () => {
    const del20 = ann({ eventDate: '2026-11-20' })
    const del7 = ann({ eventDate: '2026-11-07' })
    const fuera = [
      ann({ eventDate: '2026-11-06' }),
      ann({ eventDate: '2026-11-10', status: 'borrador' }),
      ann({ eventDate: '2026-11-10', status: 'no_cabe' }),
      ann({ eventDate: '2026-11-10', deletedAt: '2026-11-02T00:00:00.000Z' }),
      ann({ typeId: 'cumpleanos', eventDate: undefined, values: { modo: 'individual', personas: [] } }),
      ann({ typeId: 'aviso', eventDate: undefined }),
    ]
    expect(suggestedItems('2026-11-07', [del20, ...fuera, del7])).toEqual([{ announcementId: del7.id }, { announcementId: del20.id }])
  })

  it('newPresentation: sugerencias, portada y cierre activos, sin publicar', () => {
    const a = ann()
    expect(newPresentation('2026-11-07', [a])).toEqual({
      date: '2026-11-07',
      items: [{ announcementId: a.id }],
      showCover: true,
      showClosing: true,
      published: false,
    })
  })
})

describe('moveItem (RF-51)', () => {
  it('mueve una copia; fuera de rango no cambia nada', () => {
    const items = ['a', 'b', 'c']
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(items, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(moveItem(items, 0, 5)).toEqual(items)
    expect(moveItem(items, -1, 0)).toEqual(items)
    expect(items).toEqual(['a', 'b', 'c'])
  })
})

describe('presentationSlides (RF-53, RF-54)', () => {
  const ctx = makeCtx()
  const culto = ann()
  const cumple = ann({
    typeId: 'cumpleanos',
    templateId: 'cumpleanos',
    values: { modo: 'individual', personas: [{ name: 'Ana', day: 8, month: 11 }, { name: 'Luis', day: 9, month: 11 }] },
    eventDate: undefined,
  })
  const kinds = (slides: { spec: SlideSpec }[]) => slides.map((s) => s.spec.kind)

  it('portada + slides de cada anuncio (cumpleaños da varias) + cierre', () => {
    const slides = presentationSlides(pres({ items: [{ announcementId: culto.id }, { announcementId: cumple.id }] }), index(culto, cumple), ctx)
    expect(kinds(slides)).toEqual(['cover', 'announcement', 'birthday-single', 'birthday-single', 'closing'])
    expect(slides[0]!.announcementId).toBeUndefined()
    expect(slides.at(-1)!.announcementId).toBeUndefined()
    expect(slides[2]!.announcementId).toBe(cumple.id)
  })

  it('estilo de portada y cierre de la presentación (sin él → el de Configuración); los anuncios no cambian', () => {
    const style = (slides: { spec: SlideSpec }[]) => slides.map((s) => ('slideStyle' in s.spec ? s.spec.slideStyle : undefined))
    const p = pres({ items: [{ announcementId: culto.id }] })
    expect(style(presentationSlides({ ...p, slideStyle: 'cartel' }, index(culto), ctx))).toEqual(['cartel', 'almanaque', 'cartel'])
    expect(style(presentationSlides(p, index(culto), ctx))).toEqual(['almanaque', 'almanaque', 'almanaque'])
  })

  it('sin portada empieza por un anuncio; los eliminados o inexistentes no dan slides', () => {
    const borrado = ann({ deletedAt: '2026-11-02T00:00:00.000Z' })
    const p = pres({ showCover: false, showClosing: false, items: [{ announcementId: 'nada' }, { announcementId: borrado.id }, { announcementId: culto.id }] })
    expect(kinds(presentationSlides(p, index(culto, borrado), ctx))).toEqual(['announcement'])
  })

  it('contexto de la presentación: su fecha y su título de portada (vacío → el de Configuración)', () => {
    expect(kinds(presentationSlides(pres({ coverTitle: 'Avisos' }), index(), ctx))).toEqual(['cover', 'closing'])
    expect(presentationContext(pres({ coverTitle: 'Avisos', date: '2026-11-14' }), ctx)).toMatchObject({
      presentationDate: '2026-11-14',
      settings: { coverTitle: 'Avisos' },
    })
    expect(presentationContext(pres({ coverTitle: '' }), ctx).settings.coverTitle).toBe('Anuncios')
  })
})

describe('contentIssues (RF-55, RNF-10)', () => {
  it('con mediciones: un anuncio aún sin medir o midiendo no deja la presentación lista', () => {
    const a = ann({ values: { ...NORMAL.culto, titulo: 'Vigilia' } })
    const b = ann({ values: { ...NORMAL.culto, titulo: 'Ayuno' } })
    const p = pres({ items: [{ announcementId: a.id }, { announcementId: b.id }] })
    expect(contentIssues(p, index(a, b), new Map([[a.id, 'midiendo' as const]]))).toEqual([
      { kind: 'midiendo', announcementId: a.id, title: 'Vigilia' },
      { kind: 'midiendo', announcementId: b.id, title: 'Ayuno' },
    ])
    expect(contentIssues(p, index(a, b), new Map([[a.id, 'ok' as const], [b.id, 'ok' as const]]))).toEqual([])
  })

  it('vacía, eliminado, borrador, no cabe guardado o medido', () => {
    expect(contentIssues(pres(), index())).toEqual([{ kind: 'vacia' }])
    const ok = ann()
    const borrador = ann({ status: 'borrador', values: { titulo: 'Ensayo' } })
    const sinTitulo = ann({ status: 'no_cabe', typeId: 'aviso', values: {} })
    const medido = ann({ values: { ...NORMAL.culto, titulo: 'Campaña' } })
    const p = pres({ items: [ok, { id: 'x' }, borrador, sinTitulo, medido].map((a) => ({ announcementId: a.id! })) })
    expect(contentIssues(p, index(ok, borrador, sinTitulo, medido), new Map([[ok.id, 'ok' as const], [medido.id, 'no_cabe' as const]]))).toEqual([
      { kind: 'eliminado', index: 1 },
      { kind: 'borrador', announcementId: borrador.id, title: 'Ensayo' },
      { kind: 'no_cabe', announcementId: sinTitulo.id, title: 'Sin título' },
      { kind: 'no_cabe', announcementId: medido.id, title: 'Campaña' },
    ])
  })
})
