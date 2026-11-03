import { afterEach, describe, expect, it } from 'vitest'
import '../../../src/ui/styles.css'
import { createRepository } from '../../../src/data/local/repository'
import { NORMAL } from '../../fixtures/announcements'
import { fakeChannel } from '../helpers/channel'
import { cleanupMounted } from '../helpers/mount'
import { cleanupDbs, mountApp, seed, testDb, until } from '../helpers/app'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

async function openPublic(id?: string) {
  const db = testDb()
  let presentationId = id
  if (!presentationId) {
    const a = await seed(db, { typeId: 'culto', values: { ...NORMAL.culto } })
    const b = await seed(db, { typeId: 'culto', values: { ...NORMAL.culto, titulo: 'Ayuno' } })
    const p = await createRepository(db.presentations).put({
      date: '2026-11-07',
      items: [{ announcementId: a.id }, { announcementId: b.id }],
      showCover: true,
      showClosing: true,
      published: false,
    })
    presentationId = p.id
  }
  const channel = fakeChannel()
  const mounted = await mountApp(`/publica/${presentationId}`, db, { width: 960, height: 540 }, channel.provide)
  const stage = () => mounted.host.querySelector<HTMLElement>('[data-stage]')
  return { ...mounted, channel, stage, presentationId }
}

const visible = (host: HTMLElement) => [...host.querySelectorAll<HTMLElement>('[data-stage-slide]')].filter((s) => s.classList.contains('opacity-100'))

describe('Ventana pública (RF-61, RF-68)', () => {
  it('sin marco de la app; envía hello y espera en negro', async () => {
    const { host, channel, stage, presentationId } = await openPublic()
    await until(() => !!stage())
    expect(host.querySelector('header')).toBeNull()
    expect(channel.openedFor()).toBe(presentationId)
    expect(channel.sent).toContainEqual({ type: 'hello' })
    expect(stage()!.hasAttribute('data-black')).toBe(true)
    const root = host.querySelector<HTMLElement>('[data-public]')!
    expect(root.classList).toContain('cursor-none')
    expect(getComputedStyle(root).backgroundColor).toBe('rgb(0, 0, 0)')
    expect(getComputedStyle(stage()!).backgroundColor).toBe('rgb(0, 0, 0)')
    const buttons = [...host.querySelectorAll('button')].filter((b) => !b.closest('[data-fullscreen-hint]'))
    expect(buttons).toEqual([])
  })

  it('state → esa slide sola visible; negro y logo encima', async () => {
    const { host, channel, stage } = await openPublic()
    await until(() => host.querySelectorAll('[data-stage-slide]').length === 4)
    channel.receive({ type: 'state', state: { index: 2, black: false, logo: false } })
    await until(() => stage()!.dataset.index === '2' && !stage()!.hasAttribute('data-black'))
    expect(visible(host).map((s) => s.dataset.stageSlide)).toEqual(['2'])
    expect(host.querySelector('[data-stage-slide="2"]')!.className).toContain('motion-reduce:transition-none')
    channel.receive({ type: 'black', on: true })
    await until(() => stage()!.hasAttribute('data-black'))
    channel.receive({ type: 'logo', on: true })
    await until(() => !!host.querySelector('[data-logo-screen] img'))
    expect(host.querySelector<HTMLImageElement>('[data-logo-screen] img')!.src).toMatch(/blanco/)
    channel.receive({ type: 'goto', index: 1 })
    await until(() => stage()!.dataset.index === '1')
  })

  it('una tecla en la pública se envía como comando y no avanza sola', async () => {
    const { channel, stage } = await openPublic()
    channel.receive({ type: 'state', state: { index: 0, black: false, logo: false } })
    await until(() => !stage()!.hasAttribute('data-black'))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(channel.sent).toContainEqual({ type: 'command', command: { type: 'next' } })
    expect(stage()!.dataset.index).toBe('0')
  })

  it('una presentación que no existe → negro, sin texto', async () => {
    const { host, stage } = await openPublic('no-existe')
    await until(() => !!stage())
    expect(stage()!.hasAttribute('data-black')).toBe(true)
    expect(host.querySelector('[data-stage]')!.textContent!.trim()).toBe('')
  })
})
