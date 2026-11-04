// Motor de sincronización (§8.4) entre dos equipos que comparten un servidor en memoria: sube la cola,
// baja por cursor, gana la última edición hecha, imágenes primero el archivo y nada se aplica mientras
// se presenta.
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { createDb, type AppDb } from '../../../../src/data/local/db'
import { saveImage } from '../../../../src/data/local/images'
import { createRepository } from '../../../../src/data/local/repository'
import type { Announcement, ImageAsset } from '../../../../src/data/models'
import { pullAll } from '../../../../src/data/sync/pull'
import { runSync } from '../../../../src/data/sync/runSync'
import { SyncError } from '../../../../src/data/sync/types'
import { memoryRemote } from './memoryRemote'

const opened: AppDb[] = []
let n = 0
function device() {
  const d = createDb(`sync-test-${++n}`)
  opened.push(d)
  return d
}
afterEach(async () => {
  for (const d of opened.splice(0)) await d.delete()
})

const notPresenting = { isPresenting: async () => false }
const at = (iso: string) => () => new Date(iso)
const draft = (title: string, id?: string) =>
  ({ id, typeId: 'aviso', templateId: 't', logo: { kind: 'iglesia' }, values: { title }, imageIds: [], status: 'listo' }) as unknown as Omit<Announcement, 'id' | 'updatedAt'>
const titleOf = async (d: AppDb, id: string) => ((await d.announcements.get(id))?.values as { title?: string } | undefined)?.title
const svg = () => new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"></svg>'], { type: 'image/svg+xml' })

describe('runSync', () => {
  it('lo creado en un equipo aparece en el otro, sin dejar pendientes', async () => {
    const remote = memoryRemote()
    const [a, b] = [device(), device()]
    const saved = await createRepository(a.announcements).put(draft('Junta'))
    expect(await runSync(a, remote, notPresenting)).toMatchObject({ pushed: 1 })
    expect(await runSync(b, remote, notPresenting)).toMatchObject({ pulled: 1 })
    expect(await titleOf(b, saved.id)).toBe('Junta')
    expect(await a.outbox.count()).toBe(0)
    expect(await b.outbox.count()).toBe(0)
    expect(await b.syncState.get('lastSyncAt')).toBeDefined()
  })

  it('gana la edición más nueva aunque llegue primero la otra', async () => {
    const remote = memoryRemote()
    const [a, b] = [device(), device()]
    await createRepository(a.announcements, at('2026-11-06T20:00:00Z')).put(draft('Base', 'x'))
    await runSync(a, remote, notPresenting)
    await runSync(b, remote, notPresenting)
    // Ambos editan sin red: A el viernes en la noche, B (más viejo) el viernes en la tarde.
    await createRepository(a.announcements, at('2026-11-06T22:00:00Z')).put(draft('Corregido', 'x'))
    await createRepository(b.announcements, at('2026-11-06T18:00:00Z')).put(draft('Viejo', 'x'))
    await runSync(a, remote, notPresenting)
    await runSync(b, remote, notPresenting) // B llega después pero con una edición más vieja
    expect(await titleOf(b, 'x')).toBe('Corregido')
    expect(await titleOf(a, 'x')).toBe('Corregido')
    expect(await b.outbox.count()).toBe(0)
  })

  it('lo editado durante la subida queda pendiente', async () => {
    const remote = memoryRemote()
    const a = device()
    const repo = createRepository(a.announcements)
    const saved = await repo.put(draft('Primero'))
    remote.duringPush = async () => {
      remote.duringPush = undefined
      await repo.put({ ...saved, values: { title: 'Segundo' } } as Announcement)
    }
    await runSync(a, remote, notPresenting)
    expect(await a.outbox.toArray()).toEqual([{ table: 'announcements', id: saved.id }])
    expect(await titleOf(a, saved.id)).toBe('Segundo')
    await runSync(a, remote, notPresenting)
    expect((remote.rows.get('announcements')!.get(saved.id)!.data as { values: { title: string } }).values.title).toBe('Segundo')
  })

  it('al bajar no pisa un cambio local más nuevo que aún no subió', async () => {
    const remote = memoryRemote()
    const a = device()
    await createRepository(a.announcements, at('2026-11-06T22:00:00Z')).put(draft('Local', 'x'))
    await remote.push('announcements', [{ id: 'x', data: { id: 'x', values: { title: 'Nube' } }, updated_at: '2026-11-06T20:00:00Z', deleted_at: null }])
    await pullAll(a, remote)
    expect(await titleOf(a, 'x')).toBe('Local')
    expect(await a.outbox.count()).toBe(1)
  })

  it('la imagen sube primero el archivo y el otro equipo la descarga', async () => {
    const remote = memoryRemote()
    const [a, b] = [device(), device()]
    const asset = await saveImage(a, svg(), 'logo')
    await runSync(a, remote, notPresenting)
    expect(remote.log.indexOf(`upload:${asset.storagePath}`)).toBeLessThan(remote.log.indexOf('push:images'))
    await runSync(b, remote, notPresenting)
    expect(await b.images.get(asset.id)).toMatchObject({ hash: asset.hash })
    expect(await b.imageBlobs.get(asset.id)).toBeDefined()
  })

  it('una imagen sin archivo local espera en la cola', async () => {
    const remote = memoryRemote()
    const a = device()
    const img: ImageAsset = { id: 'i1', updatedAt: '2026-11-03T10:00:00.000Z', storagePath: 'images/h.webp', hash: 'h', width: 1, height: 1, kind: 'foto' }
    await a.images.put(img)
    await a.outbox.put({ table: 'images', id: 'i1' })
    await runSync(a, remote, notPresenting)
    expect(remote.rows.get('images')?.size ?? 0).toBe(0)
    expect(await a.outbox.count()).toBe(1)
  })

  it('dos equipos con la misma imagen sin red no chocan', async () => {
    const remote = memoryRemote()
    const [a, b] = [device(), device()]
    await saveImage(a, svg(), 'logo')
    await saveImage(b, svg(), 'logo')
    await runSync(a, remote, notPresenting)
    await expect(runSync(b, remote, notPresenting)).resolves.toBeDefined()
    expect(await b.images.count()).toBe(2)
  })

  it('durante una presentación sube pero no aplica lo que baja', async () => {
    const remote = memoryRemote()
    const [a, b] = [device(), device()]
    const saved = await createRepository(a.announcements).put(draft('Nuevo'))
    await runSync(a, remote, notPresenting)
    await createRepository(b.presentations).put({ date: '2026-11-07', items: [], showCover: true, showClosing: true, published: false })
    await runSync(b, remote, { isPresenting: async () => true })
    expect(await b.announcements.get(saved.id)).toBeUndefined()
    expect(remote.rows.get('presentations')?.size).toBe(1)
    await runSync(b, remote, notPresenting)
    expect(await titleOf(b, saved.id)).toBe('Nuevo')
  })

  it('sin red lanza SyncError offline y conserva la cola', async () => {
    const remote = memoryRemote()
    const a = device()
    await createRepository(a.announcements).put(draft('X'))
    remote.fail('offline')
    await expect(runSync(a, remote, notPresenting)).rejects.toMatchObject({ kind: 'offline' })
    await expect(runSync(a, remote, notPresenting)).rejects.toBeInstanceOf(SyncError)
    expect(await a.outbox.count()).toBe(1)
  })

  it('una tabla rechazada no frena a las demás', async () => {
    const remote = memoryRemote()
    const a = device()
    await createRepository(a.announcements).put(draft('X'))
    await createRepository(a.presentations).put({ date: '2026-11-07', items: [], showCover: true, showClosing: true, published: false })
    remote.reject('announcements')
    await runSync(a, remote, notPresenting)
    expect(remote.rows.get('presentations')?.size).toBe(1)
    expect(await a.outbox.toArray()).toEqual([{ table: 'announcements', id: expect.any(String) }])
  })

  it('bajar dos veces no duplica ni crea pendientes y guarda el cursor', async () => {
    const remote = memoryRemote()
    const [a, b] = [device(), device()]
    await createRepository(a.announcements).put(draft('X'))
    await runSync(a, remote, notPresenting)
    await runSync(b, remote, notPresenting)
    await runSync(b, remote, notPresenting)
    expect(await b.announcements.count()).toBe(1)
    expect(await b.outbox.count()).toBe(0)
    expect((await b.syncState.get('cursor:announcements'))?.value).toBeTruthy()
  })

  it('si empiezan a presentar a mitad de la bajada, no aplica nada más ni avanza el cursor (revisión)', async () => {
    const remote = memoryRemote()
    const [a, b] = [device(), device()]
    await createRepository(a.presentations).put({ date: '2026-11-07', items: [], showCover: true, showClosing: true, published: false })
    await runSync(a, remote, notPresenting)
    let calls = 0
    await runSync(b, remote, { isPresenting: async () => ++calls > 1 }) // libre al empezar, presentando después
    expect(await b.presentations.count()).toBe(0)
    expect(await b.syncState.get('cursor:presentations')).toBeUndefined()
  })

  it('un registro rechazado no frena a los demás de su lote (revisión)', async () => {
    const remote = memoryRemote()
    const a = device()
    const repo = createRepository(a.announcements)
    const bad = await repo.put(draft('Malo'))
    const good = await repo.put(draft('Bueno'))
    remote.rejectId(bad.id)
    await runSync(a, remote, notPresenting)
    expect(remote.rows.get('announcements')?.has(good.id)).toBe(true)
    expect(await a.outbox.toArray()).toEqual([{ table: 'announcements', id: bad.id }])
  })
})
