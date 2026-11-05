// Página pública de anuncios (P9, RF-70, RF-71, RF-73): tarjetas numeradas con su tipo, título y datos;
// los estados vacío, sin conexión (con y sin caché) y error; letra de 15–16 px y títulos de 18 px.
import { afterEach, describe, expect, it } from 'vitest'
import '../../../src/ui/styles.css'
import PublicNoticesApp from '../../../src/public-notices/PublicNoticesApp.vue'
import type { LoadState, PublicNoticesData } from '../../../src/public-notices/types'
import { until } from '../helpers/app'
import { cleanupMounted, mountInHost } from '../helpers/mount'

afterEach(() => cleanupMounted())

const DATA: PublicNoticesData = {
  today: '2026-11-05',
  settings: { timeFormat: '12h', currency: 'DOP' },
  notices: [
    { id: 'c1', typeId: 'culto', values: { titulo: 'Culto de Santa Cena', fecha: '2026-11-07', hora: '09:00', lugar: 'Templo principal' }, eventDate: '2026-11-07', updatedAt: 'x' },
    { id: 'a1', typeId: 'aviso', values: { titulo: 'Ofrenda pro templo' }, eventDate: null, updatedAt: 'x' },
  ],
}
const SAVED = '2026-11-05T14:15:00.000Z'

function show(state: LoadState | Promise<LoadState>, width = 390) {
  const { host } = mountInHost(PublicNoticesApp, width, 844, { props: { load: () => Promise.resolve(state) } })
  return host
}
const cards = (host: HTMLElement) => [...host.querySelectorAll<HTMLElement>('[data-notice-card]')]

describe('página pública de anuncios', () => {
  it('dibuja las tarjetas numeradas con su tipo, título y filas', async () => {
    const host = show({ kind: 'fresh', data: DATA, savedAt: SAVED })
    await until(() => cards(host).length === 2)
    const [first] = cards(host)
    expect(first!.querySelector('[data-number]')!.textContent!.trim()).toBe('1')
    expect(first!.textContent).toContain('Culto')
    expect(first!.querySelector('h2')!.textContent).toBe('Culto de Santa Cena')
    expect(first!.querySelectorAll('[data-row]')).toHaveLength(3)
    expect(first!.querySelectorAll('[data-row] svg')).toHaveLength(3)
  })

  it('muestra Actualizado el … con datos frescos', async () => {
    const host = show({ kind: 'fresh', data: DATA, savedAt: SAVED })
    await until(() => !!host.textContent?.includes('Actualizado el jueves'))
  })

  it('vacío: No hay anuncios por ahora.', async () => {
    const host = show({ kind: 'fresh', data: { ...DATA, notices: [] }, savedAt: SAVED })
    await until(() => !!host.textContent?.includes('No hay anuncios por ahora.'))
  })

  it('sin conexión y sin caché: Ábrela una vez con internet…', async () => {
    const host = show({ kind: 'offline' })
    await until(() => !!host.textContent?.includes('Ábrela una vez con internet para guardarla en este celular.'))
  })

  it('error sin caché: No se pudieron cargar los anuncios. Prueba más tarde.', async () => {
    const host = show({ kind: 'error' })
    await until(() => !!host.textContent?.includes('No se pudieron cargar los anuncios. Prueba más tarde.'))
  })

  it('con caché: Sin conexión · guardado el … y las tarjetas', async () => {
    const host = show({ kind: 'cached', data: DATA, savedAt: SAVED })
    await until(() => cards(host).length === 2)
    expect(host.textContent).toContain('Sin conexión · guardado el jueves')
  })

  it('el título de la página es un h1 Anuncios y lleva Mansedumbre II · IASD', async () => {
    const host = show({ kind: 'fresh', data: DATA, savedAt: SAVED })
    await until(() => cards(host).length === 2)
    expect(host.querySelector('h1')!.textContent).toBe('Anuncios')
    expect(host.textContent).toContain('Mansedumbre II · IASD')
  })

  it('datos a 15–16 px y títulos a 18 px', async () => {
    const host = show({ kind: 'fresh', data: DATA, savedAt: SAVED })
    await until(() => cards(host).length === 2)
    const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize)
    expect(size(cards(host)[0]!.querySelector('h2')!)).toBe(18)
    for (const row of host.querySelectorAll('[data-row]')) expect([15, 16]).toContain(size(row))
  })

  it('mientras carga hay esqueleto con aria-busy', async () => {
    const host = show(new Promise<LoadState>(() => {}))
    await until(() => host.querySelector('[aria-busy="true"]') !== null)
  })

  it('a 360 px no hay scroll horizontal', async () => {
    const host = show({ kind: 'fresh', data: DATA, savedAt: SAVED }, 360)
    await until(() => cards(host).length === 2)
    const main = host.querySelector('main')!
    expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth)
  })

  it('apagada: dice que los anuncios no están disponibles', async () => {
    const host = show({ kind: 'disabled' })
    await until(() => !!host.textContent?.includes('Los anuncios no están disponibles por ahora.'))
    expect(cards(host)).toHaveLength(0)
  })

  it('la franja del equipo sale solo en la vista del equipo', async () => {
    const TEXT = 'Incluye nombres y contactos privados. No compartas capturas de esta pantalla.'
    const team = show({ kind: 'fresh', data: DATA, savedAt: SAVED, team: true })
    await until(() => cards(team).length === 2)
    expect(team.querySelector('[data-team-banner]')?.textContent).toContain('Vista del equipo.')
    expect(team.querySelector('[data-team-banner]')?.textContent).toContain(TEXT)
    cleanupMounted()
    const pub = show({ kind: 'fresh', data: DATA, savedAt: SAVED })
    await until(() => cards(pub).length === 2)
    expect(pub.querySelector('[data-team-banner]')).toBeNull()
  })
})
