// Almacenamiento (RF-102): el espacio de este equipo, "Proteger los datos" y, con sesión, el uso de la
// nube sobre 1 GB (o "No se pudo consultar").
import { flushPromises, mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Auth } from '../../../src/data/sync/auth'
import { syncPlugin, type SyncContext } from '../../../src/data/sync/useSync'
import StorageSection from '../../../src/features/settings/StorageSection.vue'

const wrappers: { unmount(): void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  delete (navigator as unknown as Record<string, unknown>).storage
})

function fakeStorage(persisted = false) {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { estimate: async () => ({ usage: 2048 }), persisted: async () => persisted, persist: async () => true },
  })
}

function sync(usedBytes: () => Promise<number>): SyncContext {
  const auth = { session: shallowRef({ email: 'ana@iglesia.do' }) } as unknown as Auth
  return { service: {}, auth, remote: { usedBytes } } as unknown as SyncContext
}

async function render(ctx: SyncContext | null = null) {
  const w = mount(StorageSection, { attachTo: document.body, global: { plugins: [syncPlugin(shallowRef(ctx))] } })
  wrappers.push(w)
  await flushPromises()
  return w
}

describe('Almacenamiento', () => {
  it('muestra lo usado en este equipo y protege los datos', async () => {
    fakeStorage()
    const w = await render()
    expect(w.text()).toContain('2 KB')
    const button = w.findAll('button').find((b) => b.text() === 'Proteger los datos')!
    await button.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Listo')
  })

  it('si ya están protegidos lo dice y no ofrece el botón', async () => {
    fakeStorage(true)
    const w = await render()
    expect(w.text()).toContain('Los datos están protegidos')
    expect(w.findAll('button').some((b) => b.text() === 'Proteger los datos')).toBe(false)
  })

  it('sin sincronización no aparece "En la nube"', async () => {
    fakeStorage()
    expect((await render()).text()).not.toContain('En la nube')
  })

  it('con sesión muestra el uso de la nube sobre 1 GB', async () => {
    fakeStorage()
    const w = await render(sync(async () => 5 * 1024 ** 2))
    expect(w.text()).toContain('5 MB de 1 GB')
  })

  it('si la nube falla dice "No se pudo consultar"', async () => {
    fakeStorage()
    const w = await render(sync(vi.fn(async () => Promise.reject(new Error('x')))))
    expect(w.text()).toContain('No se pudo consultar')
  })

  it('sin navigator.storage lo dice', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined })
    expect((await render()).text()).toContain('Este navegador no informa el espacio usado')
  })
})
