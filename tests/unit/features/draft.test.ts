import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { draftFrom } from '../../../src/data/announcements'
import type { NewRecord, Repository } from '../../../src/data/local/repository'
import type { Announcement } from '../../../src/data/models'
import { DEFAULT_SETTINGS, SETTINGS_ID } from '../../../src/data/settings'
import { plainCopy } from '../../../src/lib/plain'
import { useAnnouncementDraft } from '../../../src/features/announcements/editor/useAnnouncementDraft'
import { NORMAL } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'

const SETTINGS = { ...DEFAULT_SETTINGS, id: SETTINGS_ID, updatedAt: '' }

/** Repositorio en memoria: lo que se guardó, en orden. */
function memoryRepo() {
  const saved: Announcement[] = []
  const repo: Repository<Announcement> = {
    async put(r: NewRecord<Announcement>) {
      r = plainCopy(r) // como el repositorio real: guarda una copia al llamarse
      await new Promise((done) => setTimeout(done, 10)) // como IndexedDB: la escritura toma un momento
      const rec = { ...r, id: r.id ?? `id-${saved.length + 1}`, updatedAt: 'ahora' } as Announcement
      saved.push(rec)
      return rec
    },
    get: async () => undefined,
    list: async () => saved,
    remove: async () => {},
    restore: async () => {},
  }
  return { repo, saved }
}

function setup(initial: NewRecord<Announcement> = { ...draftFrom('culto', SETTINGS), values: { ...NORMAL.culto } }) {
  const { repo, saved } = memoryRepo()
  const draft = useAnnouncementDraft(initial, ref(makeCtx()), repo)
  return { ...draft, saved }
}

afterEach(() => vi.useRealTimers())

describe('useAnnouncementDraft', () => {
  it('dirty: falso al abrir, verdadero tras cambiar un valor', async () => {
    const d = setup()
    expect(d.dirty.value).toBe(false)
    d.draft.value.values.titulo = 'Otro título'
    await nextTick()
    expect(d.dirty.value).toBe(true)
  })

  it('slides de un culto: 1 SlideSpec con el estilo elegido', () => {
    const d = setup()
    d.draft.value.slideStyle = 'cartel'
    expect(d.slides.value).toHaveLength(1)
    expect(d.slides.value[0]).toMatchObject({ kind: 'announcement', slideStyle: 'cartel' })
  })

  it('cumpleaños en grupo con 9 personas sin foto → 2 slides', () => {
    const personas = Array.from({ length: 9 }, (_, i) => ({ name: `Persona ${i + 1}`, day: 10 + i, month: 11 }))
    const d = setup({ ...draftFrom('cumpleanos', SETTINGS), values: { modo: 'grupo', personas, mostrarDia: 'si' } })
    expect(d.slides.value).toHaveLength(2)
  })

  it('save espera a que termine de medir: midiendo → no_cabe guarda "no_cabe"', async () => {
    const d = setup()
    d.slideStatus.value = { status: 'midiendo', offendingFields: [] }
    const saving = d.save()
    await Promise.resolve()
    expect(d.saved).toHaveLength(0)
    d.slideStatus.value = { status: 'no_cabe', offendingFields: ['titulo'], reason: 'fit' }
    const rec = await saving
    expect(rec.status).toBe('no_cabe')
  })

  it('si nunca deja de medir, guarda como borrador a los 2 s', async () => {
    vi.useFakeTimers()
    const d = setup()
    d.slideStatus.value = { status: 'midiendo', offendingFields: [] }
    const saving = d.save()
    await vi.advanceTimersByTimeAsync(2100)
    expect((await saving).status).toBe('borrador')
  })

  it('save de un culto válido: listo, con eventDate, imageIds y el id para la próxima vez; deja de estar sucio', async () => {
    const d = setup({ ...draftFrom('culto', SETTINGS), values: { ...NORMAL.culto, fotoPredicador: 'foto-1' } })
    d.slideStatus.value = { status: 'ok', offendingFields: [] }
    d.draft.value.values.titulo = 'Culto joven'
    const rec = await d.save()
    expect(rec).toMatchObject({ status: 'listo', eventDate: NORMAL.culto.fecha, imageIds: ['foto-1'] })
    expect(d.draft.value.id).toBe(rec.id)
    expect(d.dirty.value).toBe(false)
    await d.save()
    expect(d.saved.map((r) => r.id)).toEqual([rec.id, rec.id])
  })

  it('valores que ya no validan (fecha rota) → sin slides, nunca una excepción', () => {
    const d = setup({ ...draftFrom('culto', SETTINGS), values: { ...NORMAL.culto, fecha: 'no-es-fecha' } })
    expect(() => d.slides.value).not.toThrow()
    expect(d.slides.value).toEqual([])
    expect(d.validation.value.ok).toBe(false)
  })

  // Revisión final P4: lo que se teclea mientras se escribe en la base de datos no se pierde.
  it('un cambio durante la escritura sigue pendiente (dirty) y no se pierde', async () => {
    const d = setup()
    d.slideStatus.value = { status: 'ok', offendingFields: [] }
    const saving = d.save()
    await new Promise((r) => setTimeout(r, 5))
    d.draft.value.values.titulo = 'Escrito mientras se guardaba'
    const rec = await saving
    expect(rec.values.titulo).toBe(NORMAL.culto.titulo)
    expect(d.draft.value.values.titulo).toBe('Escrito mientras se guardaba')
    expect(d.dirty.value).toBe(true)
  })

  it('save de un anuncio que no valida: borrador sin esperar la medición', async () => {
    const d = setup({ ...draftFrom('culto', SETTINGS), values: {} })
    d.slideStatus.value = { status: 'midiendo', offendingFields: [] }
    expect((await d.save()).status).toBe('borrador')
  })
})
