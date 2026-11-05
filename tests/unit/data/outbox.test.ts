// Cola de cambios locales (§8.4): toda escritura deja { table, id } en `outbox` en la misma
// transacción, para que nada se guarde sin quedar pendiente de subir.
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { saveImage } from '../../../src/data/local/images'
import { createRepository } from '../../../src/data/local/repository'
import type { Announcement, ImageAsset } from '../../../src/data/models'

const opened: AppDb[] = []
let n = 0
function db() {
  const d = createDb(`outbox-test-${++n}`)
  opened.push(d)
  return d
}
afterEach(async () => {
  for (const d of opened.splice(0)) await d.delete()
})

const announcement = (id?: string) =>
  ({ id, typeId: 'aviso', templateId: 't', logo: { kind: 'iglesia' }, values: {}, imageIds: [], status: 'activo' }) as unknown as Omit<Announcement, 'id' | 'updatedAt'> & { id?: string }

describe('outbox', () => {
  it('put deja una entrada con la tabla y el id', async () => {
    const d = db()
    const saved = await createRepository(d.announcements).put(announcement())
    expect(await d.outbox.toArray()).toEqual([{ table: 'announcements', id: saved.id }])
  })

  it('diez put del mismo registro dejan una sola entrada', async () => {
    const d = db()
    const repo = createRepository(d.announcements)
    const saved = await repo.put(announcement())
    for (let i = 0; i < 9; i++) await repo.put({ ...saved })
    expect(await d.outbox.count()).toBe(1)
  })

  it('remove deja entrada', async () => {
    const d = db()
    await d.announcements.put({ ...announcement('a1'), id: 'a1', updatedAt: '2026-01-01T00:00:00.000Z' } as Announcement)
    await createRepository(d.announcements).remove('a1')
    expect(await d.outbox.toArray()).toEqual([{ table: 'announcements', id: 'a1' }])
  })

  it('restore deja entrada', async () => {
    const d = db()
    await d.announcements.put({ ...announcement('a1'), id: 'a1', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: '2026-01-02T00:00:00.000Z' } as Announcement)
    await createRepository(d.announcements).restore('a1')
    expect(await d.outbox.toArray()).toEqual([{ table: 'announcements', id: 'a1' }])
  })

  it('un put dentro de una transacción que incluye outbox funciona', async () => {
    const d = db()
    const repo = createRepository(d.presentations)
    await d.transaction('rw', d.presentations, d.announcements, d.outbox, async () => {
      await repo.put({ date: '2026-11-07', items: [], showCover: true, showClosing: true, published: false })
    })
    expect(await d.outbox.where('table').equals('presentations').count()).toBe(1)
  })

  it('saveImage deja entrada de images', async () => {
    const d = db()
    const svg = new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'], { type: 'image/svg+xml' })
    const asset = await saveImage(d, svg, 'logo')
    expect(await d.outbox.toArray()).toEqual([{ table: 'images', id: asset.id }])
  })

  it('dos imágenes con el mismo hash y distinto id pueden convivir', async () => {
    const d = db()
    const img = (id: string): ImageAsset => ({ id, updatedAt: '2026-01-01T00:00:00.000Z', storagePath: 'images/h.webp', hash: 'h', width: 1, height: 1, kind: 'foto' })
    await d.images.put(img('i1'))
    await expect(d.images.put(img('i2'))).resolves.toBe('i2')
  })
})
