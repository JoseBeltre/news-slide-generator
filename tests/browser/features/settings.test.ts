// Configuración (RF-110, RF-111): cada control guarda al momento en `settings` (y entra en outbox);
// un texto vacío vuelve a su valor por defecto; sin nube no aparece Equipo; /equipo lleva aquí.
import { afterEach, describe, expect, it } from 'vitest'
import { loadSettings } from '../../../src/data/settings'
import { cleanupMounted } from '../helpers/mount'
import { byLabel, cleanupDbs, mountApp, testDb, until } from '../helpers/app'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

async function open() {
  const db = testDb()
  const app = await mountApp('/configuracion', db)
  await until(() => !!app.host.querySelector('#slides'))
  return { db, ...app }
}

async function choose(host: HTMLElement, label: string | RegExp) {
  const el = byLabel(host, label)
  if (!el) throw new Error(`no hay «${label}»`)
  el.click()
}

describe('Configuración', () => {
  it('elegir US$ guarda la moneda y entra en outbox', async () => {
    const { db, host } = await open()
    await choose(host, 'US$')
    await until(async () => (await loadSettings(db)).currency === 'USD')
    expect(await db.outbox.toArray()).toContainEqual({ table: 'settings', id: 'configuracion' })
  })

  it('elegir Cartel cambia el estilo por defecto', async () => {
    const { db, host } = await open()
    await choose(host, /^Cartel/)
    await until(async () => (await loadSettings(db)).slideStyle === 'cartel')
  })

  it('elegir 24 horas guarda timeFormat', async () => {
    const { db, host } = await open()
    await choose(host, '24 horas')
    await until(async () => (await loadSettings(db)).timeFormat === '24h')
  })

  it('elegir un tema guarda defaultThemeId', async () => {
    const { db, host } = await open()
    await choose(host, /Vino/)
    await until(async () => (await loadSettings(db)).defaultThemeId === 'vino')
  })

  it('vaciar el título de la portada vuelve a "Anuncios"', async () => {
    const { db, host } = await open()
    const input = host.querySelector<HTMLInputElement>('#config-portada')!
    input.value = 'Avisos'
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new Event('change'))
    await until(async () => (await loadSettings(db)).coverTitle === 'Avisos')
    input.value = ''
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new Event('change'))
    await until(async () => (await loadSettings(db)).coverTitle === 'Anuncios')
    await until(() => input.value === 'Anuncios')
  })

  it('sin nube no aparece Equipo', async () => {
    const { host } = await open()
    expect(host.querySelector('#equipo')).toBeNull()
    const nav = host.querySelector('nav[aria-label="Secciones"]')!
    expect(byLabel(nav, 'Equipo')).toBeUndefined()
  })

  it('/equipo redirige a /configuracion#equipo', async () => {
    const { router } = await mountApp('/equipo', testDb())
    expect(router.currentRoute.value.fullPath).toBe('/configuracion#equipo')
  })

  it('el encabezado enlaza a Configuración', async () => {
    const { host } = await open()
    expect(host.querySelector('nav[aria-label="Principal"] a[href="/configuracion"]')).not.toBeNull()
  })
})
