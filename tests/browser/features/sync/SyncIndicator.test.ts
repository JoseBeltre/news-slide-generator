// Indicador de sincronización (RF-101): un texto corto por estado; sin nube no aparece; el panel ofrece
// "Sincronizar" con sesión y "Entrar" sin ella.
import { mount } from '@vue/test-utils'
import { computed, ref, shallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Auth } from '../../../../src/data/sync/auth'
import type { SyncService, SyncState } from '../../../../src/data/sync/service'
import type { SyncStatus } from '../../../../src/data/sync/status'
import '../../../../src/ui/styles.css'
import SyncIndicator from '../../../../src/features/sync/SyncIndicator.vue'
import { syncPlugin, type SyncContext } from '../../../../src/data/sync/useSync'

const wrappers: { unmount(): void }[] = []
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))

function context(status: SyncStatus, pending = 0, email: string | null = 'ana@iglesia.do') {
  const state = ref<SyncState>({ status, pending, lastSyncAt: '2026-11-07T13:05:00.000Z' })
  const service = { state: computed(() => state.value), syncNow: vi.fn(async () => {}), start() {}, stop() {} } as SyncService
  const auth = { session: ref(email ? { email } : null) } as unknown as Auth
  return { service, auth, remote: {} } as unknown as SyncContext
}

function render(ctx: SyncContext | null) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }] })
  const w = mount(SyncIndicator, { attachTo: document.body, global: { plugins: [router, syncPlugin(shallowRef(ctx))] } })
  wrappers.push(w)
  return w
}

describe('SyncIndicator', () => {
  it.each([
    ['sincronizado', 0, 'Sincronizado'],
    ['pendiente', 3, 'Cambios pendientes · 3'],
    ['sin-conexion', 0, 'Sin conexión'],
    ['sin-sesion', 0, 'Entra para sincronizar'],
    ['nube-no-responde', 0, 'La nube no responde'],
  ] as const)('%s → «%s»', (status, pending, text) => {
    const button = render(context(status, pending)).get('button')
    expect(button.text()).toBe(text)
    expect(button.attributes('aria-label')).toBe(text) // en el celular solo se ve el ícono
  })

  it('sin nube configurada o desactivado no muestra nada', () => {
    expect(render(null).find('button').exists()).toBe(false)
    expect(render(context('desactivado')).find('button').exists()).toBe(false)
  })

  it('con sesión, el panel ofrece "Sincronizar" y Equipo', async () => {
    const ctx = context('pendiente', 2)
    const w = render(ctx)
    await w.get('button').trigger('click')
    const now = w.findAll('button').find((b) => b.text() === 'Sincronizar')!
    await now.trigger('click')
    expect(ctx.service.syncNow).toHaveBeenCalled()
    expect(w.text()).toContain('ana@iglesia.do')
    expect(w.find('a[href="/configuracion#equipo"]').exists()).toBe(true)
  })

  it('el panel tiene fondo propio (no transparente)', async () => {
    const w = render(context('sincronizado'))
    await w.get('button').trigger('click')
    const bg = getComputedStyle(w.get('[role="dialog"]').element).backgroundColor
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })

  it('sin sesión, el panel ofrece "Entrar"', async () => {
    const w = render(context('sin-sesion', 0, null))
    await w.get('button').trigger('click')
    expect(w.get('a[href="/entrar"]').text()).toBe('Entrar')
  })
})
