// "Mostrar al público" (P9): la casilla del editor, marcada por defecto, que no sale en cumpleaños ni en
// imagen; y el ojo tachado en la lista para un anuncio oculto.
import { afterEach, describe, expect, it } from 'vitest'
import { byLabel, cleanupDbs, daysFromToday, mountApp, seed, testDb, until } from '../helpers/app'
import { cleanupMounted } from '../helpers/mount'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

const toggle = (host: HTMLElement) =>
  [...host.querySelectorAll('label')].find((l) => l.textContent?.trim() === 'Mostrar al público')?.querySelector('input')

function type(el: HTMLInputElement, text: string) {
  el.value = text
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('Mostrar al público', () => {
  it('la casilla Mostrar al público sale marcada en un anuncio nuevo', async () => {
    const { host } = await mountApp('/anuncios/nuevo/aviso', testDb())
    await until(() => !!toggle(host))
    expect(toggle(host)!.checked).toBe(true)
  })

  it('avisa que no se escriban nombres ni teléfonos', async () => {
    const { host } = await mountApp('/anuncios/nuevo/aviso', testDb())
    await until(() => !!toggle(host))
    expect(host.textContent).toContain('Sale en la página que se comparte con la congregación. No escribas nombres ni teléfonos de personas.')
  })

  it('desmarcarla y guardar deja showPublic false', async () => {
    const db = testDb()
    const { host, router } = await mountApp('/anuncios/nuevo/culto', db)
    await until(() => !!toggle(host) && !!host.querySelector('#campo-titulo'))
    type(host.querySelector<HTMLInputElement>('#campo-titulo')!, 'Culto joven')
    type(host.querySelector<HTMLInputElement>('#campo-fecha')!, daysFromToday(5))
    type(host.querySelector<HTMLInputElement>('#campo-hora')!, '19:00')
    toggle(host)!.click()
    await until(() => toggle(host)!.checked === false)
    byLabel(host, 'Guardar')!.click()
    await until(() => router.currentRoute.value.name === 'editar', 8000)
    expect((await db.announcements.toArray())[0]!.showPublic).toBe(false)
  })

  it.each(['cumpleanos', 'imagen'])('no sale en %s', async (typeId) => {
    const { host } = await mountApp(`/anuncios/nuevo/${typeId}`, testDb())
    await until(() => !!host.querySelector('form, [data-preview]'))
    expect(toggle(host)).toBeUndefined()
  })

  it('un anuncio oculto lleva el ojo tachado junto al nombre', async () => {
    const db = testDb()
    await seed(db, { typeId: 'aviso', values: { titulo: 'Oculto' }, showPublic: false })
    await seed(db, { typeId: 'aviso', values: { titulo: 'Visible' } })
    const { host } = await mountApp('/anuncios', db)
    await until(() => host.querySelectorAll('[data-announcement-row]').length === 2)
    const rows = [...host.querySelectorAll<HTMLElement>('[data-announcement-row]')]
    const hidden = rows.find((r) => r.textContent?.includes('Oculto') && !r.textContent.includes('Visible'))!
    const visible = rows.find((r) => r.textContent?.includes('Visible'))!
    expect(hidden.querySelector('[data-hidden-public]')?.textContent).toContain('Oculto al público')
    expect(hidden.querySelector('[data-hidden-public] svg')).not.toBeNull()
    expect(visible.querySelector('[data-hidden-public]')).toBeNull()
  })
})
