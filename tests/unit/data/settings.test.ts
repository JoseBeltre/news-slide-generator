import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { createRepository } from '../../../src/data/local/repository'
import { DEFAULT_SETTINGS, SETTINGS_ID, loadSettings, saveSettings } from '../../../src/data/settings'

const opened: AppDb[] = []
let n = 0
const newDb = () => {
  const db = createDb(`settings-test-${++n}`)
  opened.push(db)
  return db
}

afterEach(async () => {
  for (const db of opened.splice(0)) await db.delete()
})

describe('Configuración (RF-110)', () => {
  it('sin registro → los valores por defecto', async () => {
    const s = await loadSettings(newDb())
    expect(s).toMatchObject({ ...DEFAULT_SETTINGS, id: SETTINGS_ID })
    expect(DEFAULT_SETTINGS).toMatchObject({ churchName: 'Mansedumbre II', slideStyle: 'almanaque', dateStyle: 'largo', currency: 'DOP' })
  })

  it('con registro → el guardado', async () => {
    const db = newDb()
    await createRepository(db.settings).put({ ...DEFAULT_SETTINGS, id: SETTINGS_ID, churchName: 'Otra' })
    expect((await loadSettings(db)).churchName).toBe('Otra')
  })

  it('la tabla settings tiene índice updatedAt (list no lanza)', async () => {
    const db = newDb()
    await createRepository(db.settings).put({ ...DEFAULT_SETTINGS, id: SETTINGS_ID })
    await expect(createRepository(db.settings).list()).resolves.toHaveLength(1)
  })

  it('saveSettings guarda el cambio y lo deja en outbox', async () => {
    const db = newDb()
    await saveSettings(db, { currency: 'USD' })
    const s = await loadSettings(db)
    expect(s).toMatchObject({ ...DEFAULT_SETTINGS, currency: 'USD', id: SETTINGS_ID })
    expect(await db.outbox.toArray()).toEqual([{ table: 'settings', id: 'configuracion' }])
  })

  it('un segundo cambio conserva el primero', async () => {
    const db = newDb()
    await saveSettings(db, { currency: 'USD' })
    await saveSettings(db, { timeFormat: '24h' })
    expect(await loadSettings(db)).toMatchObject({ currency: 'USD', timeFormat: '24h' })
  })

  it('texto vacío o con espacios vuelve al valor por defecto', async () => {
    const db = newDb()
    await saveSettings(db, { coverTitle: '   ' })
    expect((await loadSettings(db)).coverTitle).toBe('Anuncios')
    await saveSettings(db, { birthdayDefaultMessage: '' })
    expect((await loadSettings(db)).birthdayDefaultMessage).toBe('¡Feliz cumpleaños!')
  })

  it('recorta los textos', async () => {
    const db = newDb()
    await saveSettings(db, { coverTitle: '  Avisos  ' })
    expect((await loadSettings(db)).coverTitle).toBe('Avisos')
  })
})
