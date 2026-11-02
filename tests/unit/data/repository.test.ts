import 'fake-indexeddb/auto'
import Dexie, { type Table } from 'dexie'
import { reactive } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { createDb } from '../../../src/data/local/db'
import { createRepository } from '../../../src/data/local/repository'
import type { SyncMeta } from '../../../src/data/models'

type Item = SyncMeta & { name: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const opened: Dexie[] = []
let n = 0

function itemsTable() {
  const db = new Dexie(`repo-test-${++n}`)
  db.version(1).stores({ items: 'id, updatedAt' })
  opened.push(db)
  return db.table<Item, string>('items') as Table<Item, string>
}

/** Reloj que avanza un minuto en cada llamada, desde 2026-11-01T12:00Z. */
function stepClock() {
  let t = Date.UTC(2026, 10, 1, 12, 0)
  return () => {
    const d = new Date(t)
    t += 60_000
    return d
  }
}

afterEach(async () => {
  for (const db of opened.splice(0)) await db.delete()
})

describe('createRepository', () => {
  it('put asigna id UUID y updatedAt con el reloj inyectado', async () => {
    const repo = createRepository(itemsTable(), () => new Date(Date.UTC(2026, 10, 1, 12, 0)))
    const r = await repo.put({ name: 'Ana' })
    expect(r.id).toMatch(UUID)
    expect(r.updatedAt).toBe('2026-11-01T12:00:00.000Z')
    expect(await repo.get(r.id)).toEqual(r)
  })

  it('put con id existente actualiza y mueve updatedAt', async () => {
    const repo = createRepository(itemsTable(), stepClock())
    const a = await repo.put({ name: 'Ana' })
    const b = await repo.put({ id: a.id, name: 'Ana María' })
    expect(b).toMatchObject({ id: a.id, name: 'Ana María', updatedAt: '2026-11-01T12:01:00.000Z' })
    expect(await repo.list()).toHaveLength(1)
  })

  it('remove es lógico: desaparece de get y list pero sigue en la tabla con deletedAt', async () => {
    const table = itemsTable()
    const repo = createRepository(table, stepClock())
    const a = await repo.put({ name: 'Ana' })
    await repo.remove(a.id)
    expect(await repo.get(a.id)).toBeUndefined()
    expect(await repo.list()).toEqual([])
    expect(await table.get(a.id)).toMatchObject({
      deletedAt: '2026-11-01T12:01:00.000Z',
      updatedAt: '2026-11-01T12:01:00.000Z',
    })
  })

  it('remove de un id inexistente no falla ni crea nada', async () => {
    const table = itemsTable()
    const repo = createRepository(table, stepClock())
    await repo.remove('no-existe')
    expect(await table.count()).toBe(0)
  })

  it('list ordena por updatedAt descendente', async () => {
    const repo = createRepository(itemsTable(), stepClock())
    await repo.put({ name: 'primero' })
    await repo.put({ name: 'segundo' })
    await repo.put({ name: 'tercero' })
    expect((await repo.list()).map((i) => i.name)).toEqual(['tercero', 'segundo', 'primero'])
  })

  it('put guarda una copia: un objeto reactive() mutado después no cambia lo guardado', async () => {
    type Tagged = Item & { tags: string[] }
    const repo = createRepository(itemsTable() as unknown as Table<Tagged, string>, stepClock())
    const draft = reactive({ name: 'Ana', tags: ['a'] })
    const saved = await repo.put(draft)
    draft.tags.push('b')
    draft.name = 'Otra'
    expect(await repo.get(saved.id)).toMatchObject({ name: 'Ana', tags: ['a'] })
    expect(saved.tags).toEqual(['a'])
  })
})

describe('createDb', () => {
  it('declara las 7 tablas con los índices de §7', async () => {
    const db = createDb(`app-test-${++n}`)
    opened.push(db)
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      ['announcements', 'imageBlobs', 'images', 'ministries', 'presentations', 'settings', 'themes'].sort(),
    )
    expect(db.verno).toBe(2)
    expect(db.table('settings').schema.idxByName.updatedAt).toBeDefined()
    expect(db.table('images').schema.idxByName.hash?.unique).toBe(true)
  })
})
