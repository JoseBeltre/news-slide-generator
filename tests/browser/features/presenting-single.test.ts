import { afterEach, describe, expect, it } from 'vitest'
import { createRepository } from '../../../src/data/local/repository'
import type { AppDb } from '../../../src/data/local/db'
import { NORMAL } from '../../fixtures/announcements'
import { cleanupMounted } from '../helpers/mount'
import { byLabel, cleanupDbs, mountApp, seed, testDb, until } from '../helpers/app'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

async function withPresentation(db: AppDb, status: 'listo' | 'borrador' = 'listo') {
  const a = await seed(db, { typeId: 'culto', values: { ...NORMAL.culto }, status })
  return createRepository(db.presentations).put({
    date: '2026-11-07',
    items: [{ announcementId: a.id }],
    showCover: true,
    showClosing: true,
    published: false,
  })
}
const key = (k: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))

describe('Una sola ventana (RF-66)', () => {
  it('teclas: → avanza, B negro, Fin a la última, Esc vuelve; sin controles y sin cursor', async () => {
    const db = testDb()
    const p = await withPresentation(db)
    const { host, router } = await mountApp(`/presentaciones/${p.id}/una-ventana`, db, { width: 960, height: 540 })
    const stage = () => host.querySelector<HTMLElement>('[data-stage]')!
    await until(() => host.querySelectorAll('[data-stage-slide]').length === 3)
    expect(host.querySelector('[data-single]')!.classList).toContain('cursor-none')
    expect([...host.querySelectorAll('button')].filter((b) => !b.closest('[data-fullscreen-hint]'))).toEqual([])
    expect(stage().hasAttribute('data-black')).toBe(false)
    key('ArrowRight')
    await until(() => stage().dataset.index === '1')
    key('b')
    await until(() => stage().hasAttribute('data-black'))
    key('End')
    await until(() => stage().dataset.index === '2' && !stage().hasAttribute('data-black'))
    key('Escape')
    await until(() => router.currentRoute.value.name === 'presentacion')
  })
})

describe('Presentar desde la presentación (RF-10)', () => {
  it('con un anuncio incompleto, bloqueado y dice por qué', async () => {
    const db = testDb()
    const p = await withPresentation(db, 'borrador')
    const { host } = await mountApp(`/presentaciones/${p.id}`, db)
    await until(() => !!byLabel(host, 'Presentar'))
    await until(() => host.textContent!.includes('«Semana de oración» está incompleto.'))
    expect((byLabel(host, 'Presentar') as HTMLButtonElement).disabled).toBe(true)
    expect((byLabel(host, 'Una sola ventana') as HTMLButtonElement).disabled).toBe(true)
  })

  it('con todo bien, Presentar abre la vista del presentador', async () => {
    const db = testDb()
    const p = await withPresentation(db)
    const { host, router } = await mountApp(`/presentaciones/${p.id}`, db)
    await until(() => !!byLabel(host, 'Presentar') && !(byLabel(host, 'Presentar') as HTMLButtonElement).disabled, 8000)
    byLabel(host, 'Presentar')!.click()
    await until(() => router.currentRoute.value.name === 'presentar')
  })
})
