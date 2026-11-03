import { afterEach, describe, expect, it, vi } from 'vitest'
import '../../../src/ui/styles.css'
import { createRepository } from '../../../src/data/local/repository'
import { PUBLIC_WINDOW_OPENER } from '../../../src/features/presenting/presenter/usePublicWindow'
import { NORMAL } from '../../fixtures/announcements'
import { fakeChannel } from '../helpers/channel'
import { cleanupMounted } from '../helpers/mount'
import { byLabel, cleanupDbs, mountApp, seed, testDb, until } from '../helpers/app'

afterEach(async () => {
  cleanupMounted()
  sessionStorage.clear()
  await cleanupDbs()
})

async function openPresenter(opts: { blocked?: boolean; startAt?: number; expect?: string } = {}) {
  const db = testDb()
  const a = await seed(db, { typeId: 'culto', values: { ...NORMAL.culto }, presenterNotes: 'Invitar a los jóvenes' })
  const b = await seed(db, { typeId: 'culto', values: { ...NORMAL.culto, titulo: 'Ayuno' } })
  const p = await createRepository(db.presentations).put({
    date: '2026-11-07',
    items: [{ announcementId: a.id }, { announcementId: b.id }],
    showCover: true,
    showClosing: true,
    published: false,
  })
  const channel = fakeChannel()
  if (opts.startAt !== undefined) sessionStorage.setItem(`presentar:${p.id}`, JSON.stringify({ index: opts.startAt, black: false, logo: true }))
  const win = { closed: false, close: vi.fn(() => (win.closed = true)) }
  const opener = vi.fn(() => (opts.blocked ? null : ((win.closed = false), win as unknown as Window)))
  const mounted = await mountApp(`/presentaciones/${p.id}/presentar`, db, { width: 1280, height: 800 }, {
    ...channel.provide,
    [PUBLIC_WINDOW_OPENER as symbol]: opener,
  })
  await until(() => mounted.host.textContent!.includes(opts.expect ?? '1 de 4'))
  const lastState = () => [...channel.sent].reverse().find((m) => m.type === 'state')
  return { ...mounted, channel, opener, win, p, lastState }
}

describe('Vista del presentador (RF-62, RF-63, RF-65, RF-67)', () => {
  it('siempre en oscuro; Siguiente envía el estado y muestra "2 de 4" con los puntos clave y las notas', async () => {
    const { host, lastState } = await openPresenter()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(getComputedStyle(host.querySelector('[data-presenter]')!).backgroundColor).toBe('rgb(10, 10, 10)')
    expect(host.querySelector('header')).toBeNull()
    byLabel(host, 'Siguiente')!.click()
    await until(() => host.textContent!.includes('2 de 4'))
    expect(lastState()).toEqual({ type: 'state', state: { index: 1, black: false, logo: false } })
    const points = host.querySelector('[data-key-points]')!.textContent!
    expect(points).toContain('Semana de oración')
    expect(points).toContain('7:00')
    expect(points).toContain('Invitar a los jóvenes')
  })

  it('miniatura 3 → salta; comando de la pública → avanza; hello → responde el estado', async () => {
    const { host, channel, lastState } = await openPresenter()
    byLabel(host, 'Ir a la slide 3')!.click()
    await until(() => host.textContent!.includes('3 de 4'))
    channel.receive({ type: 'command', command: { type: 'next' } })
    await until(() => host.textContent!.includes('4 de 4'))
    channel.sent.length = 0
    channel.receive({ type: 'hello' })
    expect(lastState()).toEqual({ type: 'state', state: { index: 3, black: false, logo: false } })
  })

  it('Negro y Logo se marcan; teclas B y → funcionan', async () => {
    const { host, lastState } = await openPresenter()
    byLabel(host, 'Negro (B)')!.click()
    await until(() => byLabel(host, 'Negro (B)')!.getAttribute('aria-pressed') === 'true')
    expect(lastState()!.type === 'state' && lastState()!.state.black).toBe(true)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }))
    await until(() => byLabel(host, 'Logo (L)')!.getAttribute('aria-pressed') === 'true')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await until(() => host.textContent!.includes('2 de 4'))
  })

  it('abrir, cerrada → "Reabrir pantalla pública" abre /publica/:id; Esc cierra y vuelve', async () => {
    const { host, opener, win, p, router } = await openPresenter()
    expect(host.textContent).toContain('Mueve la ventana a las pantallas y haz clic en ella para pantalla completa.')
    byLabel(host, 'Abrir pantalla pública')!.click()
    await until(() => opener.mock.calls.length === 1)
    expect(String((opener.mock.calls[0] as unknown[])[0])).toBe(`/publica/${p.id}`)
    win.closed = true
    await until(() => !!byLabel(host, 'Reabrir pantalla pública'), 3000)
    byLabel(host, 'Reabrir pantalla pública')!.click()
    await until(() => opener.mock.calls.length === 2)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await until(() => router.currentRoute.value.name === 'presentacion')
    expect(win.close).toHaveBeenCalled()
    // Al salir, el tema vuelve al que tenía la app (aquí, el del sistema).
    await until(() => document.documentElement.dataset.theme === undefined)
  })

  it('al recargar el presentador vuelve a su slide y se la envía a la pública', async () => {
    const { lastState } = await openPresenter({ startAt: 2, expect: '3 de 4' })
    expect(lastState()).toEqual({ type: 'state', state: { index: 2, black: false, logo: true } })
  })

  it('otro presentador de la misma presentación cambió el estado → este lo adopta sin reenviarlo', async () => {
    const { host, channel } = await openPresenter()
    channel.sent.length = 0
    channel.receive({ type: 'state', state: { index: 2, black: true, logo: false } })
    await until(() => host.textContent!.includes('3 de 4'))
    expect(channel.sent).toEqual([])
    channel.receive({ type: 'command', command: { type: 'next' } })
    await until(() => host.textContent!.includes('4 de 4'))
  })

  it('Espacio en un botón enfocado lo pulsa una vez, no avanza dos', async () => {
    const { host } = await openPresenter()
    const next = byLabel(host, 'Siguiente')!
    next.focus()
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    next.dispatchEvent(space)
    expect(space.defaultPrevented).toBe(false)
    next.click()
    await until(() => host.textContent!.includes('2 de 4'))
    await new Promise((r) => setTimeout(r, 100))
    expect(host.textContent).toContain('2 de 4')
  })

  it('si el navegador bloquea la ventana, lo dice', async () => {
    const { host } = await openPresenter({ blocked: true })
    byLabel(host, 'Abrir pantalla pública')!.click()
    await until(() => host.textContent!.includes('El navegador bloqueó la pantalla pública'))
  })
})
