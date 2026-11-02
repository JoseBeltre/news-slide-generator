import { afterEach, describe, expect, it } from 'vitest'
import { TYPE_DESCRIPTIONS } from '../../../src/features/announcements/new/typeDescriptions'
import { ANNOUNCEMENT_TYPES } from '../../../src/slides/types/definitions'
import { byLabel, cleanupDbs, mountApp, testDb, until } from '../helpers/app'
import { cleanupMounted } from '../helpers/mount'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

const cardNames = (host: HTMLElement) => [...host.querySelectorAll('[data-type-card] [data-name]')].map((el) => el.textContent?.trim())

describe('paso 1: elegir el tipo (RF-01)', () => {
  it('una tarjeta por tipo, en su orden, con su descripción', async () => {
    const { host } = await mountApp('/anuncios/nuevo', testDb())
    await until(() => cardNames(host).length === 7)
    expect(cardNames(host)).toEqual(ANNOUNCEMENT_TYPES.map((t) => t.name))
    for (const t of ANNOUNCEMENT_TYPES) expect(TYPE_DESCRIPTIONS[t.id]).toMatch(/\S/)
    expect(host.textContent).toContain(TYPE_DESCRIPTIONS.culto)
  })

  it('clic en "Culto / Servicio especial" abre el formulario del culto', async () => {
    const { host, router } = await mountApp('/anuncios/nuevo', testDb())
    await until(() => cardNames(host).length === 7)
    ;(host.querySelector('[data-type-card="culto"]') as HTMLElement).click()
    await until(() => router.currentRoute.value.name === 'nuevo-tipo')
    expect(router.currentRoute.value.params.typeId).toBe('culto')
  })

  it('la tecla 6 elige "Aviso breve"', async () => {
    const { host, router } = await mountApp('/anuncios/nuevo', testDb())
    await until(() => cardNames(host).length === 7)
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '6', bubbles: true }))
    await until(() => router.currentRoute.value.params.typeId === 'aviso')
  })

  it('las tarjetas son enlaces con el número de su atajo', async () => {
    const { host } = await mountApp('/anuncios/nuevo', testDb())
    await until(() => cardNames(host).length === 7)
    const card = byLabel(host, /Cumpleaños/)!
    expect(card.tagName).toBe('A')
    expect(card.getAttribute('aria-keyshortcuts')).toBe('4')
  })
})
