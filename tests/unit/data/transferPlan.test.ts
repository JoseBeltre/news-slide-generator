// Plan de importación (RF-112): lo nuevo entra tal cual; lo que ya está se marca y se copia por defecto;
// una presentación en una fecha ocupada bloquea hasta elegir otra.
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { createRepository } from '../../../src/data/local/repository'
import type { Announcement, ImageAsset, Presentation } from '../../../src/data/models'
import type { TransferBundle } from '../../../src/data/transfer/format'
import { canApply, copyTitle, dateConflict, planImport } from '../../../src/data/transfer/plan'

const opened: AppDb[] = []
const newDb = () => {
  const db = createDb(`plan-test-${crypto.randomUUID()}`)
  opened.push(db)
  return db
}
afterEach(async () => {
  for (const db of opened.splice(0)) await db.delete()
})

const NOW = '2026-11-05T12:00:00.000Z'
const ann = (id: string, titulo?: string): Announcement => ({
  id,
  updatedAt: NOW,
  typeId: 'aviso',
  templateId: 'clasica',
  logo: { kind: 'iglesia' },
  values: titulo ? { titulo } : {},
  imageIds: [],
  status: 'listo',
  createdAt: NOW,
})
const pres = (id: string, date: string, ids: string[]): Presentation => ({
  id,
  updatedAt: NOW,
  date,
  items: ids.map((announcementId) => ({ announcementId })),
  showCover: true,
  showClosing: true,
  published: false,
})
const img = (id: string, hash: string): ImageAsset => ({ id, updatedAt: NOW, storagePath: `images/${hash}.webp`, hash, width: 1, height: 1, kind: 'flyer' })

function bundle(announcements: Announcement[], presentation?: Presentation, images: ImageAsset[] = [], blobs = new Map<string, Blob>()): TransferBundle {
  const tipo = presentation ? 'presentacion' : 'anuncio'
  return { content: { formato: 'anuncios-del-sabado', version: 1, tipo, exportadoEn: NOW, presentation, announcements, images }, blobs }
}

describe('planImport', () => {
  it('un anuncio nuevo entra tal cual', async () => {
    const plan = await planImport(newDb(), bundle([ann('a1', 'Culto')]))
    expect(plan.announcements).toEqual([{ id: 'a1', typeId: 'aviso', title: 'Culto', exists: false, resolution: 'copia', included: true }])
    expect(canApply(plan)).toBe(true)
  })

  it('un anuncio que ya está se marca exists; uno borrado no cuenta', async () => {
    const db = newDb()
    const repo = createRepository(db.announcements)
    await repo.put(ann('a1', 'Culto'))
    await repo.put(ann('a2', 'Salida'))
    await repo.remove('a2')
    const plan = await planImport(db, bundle([ann('a1', 'Culto')]))
    expect(plan.announcements[0]!.exists).toBe(true)
    expect(plan.taken.titles).toEqual(['Culto'])
    expect((await planImport(db, bundle([ann('a2')]))).announcements[0]!.exists).toBe(false)
  })

  it('presentación en una fecha ocupada', async () => {
    const db = newDb()
    await createRepository(db.presentations).put(pres('p1', '2026-11-07', []))
    const other = await planImport(db, bundle([], pres('p2', '2026-11-07', [])))
    expect(other.presentation).toMatchObject({ id: 'p2', exists: false, resolution: 'copia', targetDate: '2026-11-07' })
    expect(dateConflict(other)).toBe(true)
    expect(canApply(other)).toBe(false)
    other.presentation!.targetDate = '2026-11-14'
    expect(dateConflict(other)).toBe(false)
    expect(canApply(other)).toBe(true)

    const same = await planImport(db, bundle([], pres('p1', '2026-11-07', [])))
    expect(dateConflict(same)).toBe(true)
    same.presentation!.resolution = 'sobrescribir'
    expect(dateConflict(same)).toBe(false)
  })

  it('missingImages cuenta las imágenes sin Blob', async () => {
    const h1 = '1'.repeat(64)
    const h2 = '2'.repeat(64)
    const plan = await planImport(newDb(), bundle([ann('a1')], undefined, [img('i1', h1), img('i2', h2)], new Map([[h1, new Blob(['x'])]])))
    expect(plan.missingImages).toBe(1)
  })

  it('sin anuncios incluidos ni presentación, canApply es false', async () => {
    const plan = await planImport(newDb(), bundle([ann('a1')]))
    plan.announcements[0]!.included = false
    expect(canApply(plan)).toBe(false)
  })
})

describe('copyTitle', () => {
  it('el primer sufijo libre, siempre con sufijo', () => {
    expect(copyTitle('Culto', new Set(['Culto']))).toBe('Culto (2)')
    expect(copyTitle('Culto', new Set(['Culto', 'Culto (2)']))).toBe('Culto (3)')
    expect(copyTitle('Culto', new Set())).toBe('Culto (2)')
  })
})
