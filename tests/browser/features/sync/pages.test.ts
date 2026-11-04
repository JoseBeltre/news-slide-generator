// Entrar con código y Equipo (§8.5): mensajes claros, nadie se quita a sí mismo, cerrar sesión con
// cambios pendientes pregunta antes.
import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref, shallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Auth } from '../../../../src/data/sync/auth'
import type { SyncService, SyncState } from '../../../../src/data/sync/service'
import { syncPlugin, type SyncContext } from '../../../../src/data/sync/useSync'
import SignInPage from '../../../../src/features/sync/signin/SignInPage.vue'
import TeamPage from '../../../../src/features/sync/team/TeamPage.vue'
import { answerConfirm, confirmState } from '../../../../src/ui/useConfirm'

const wrappers: { unmount(): void }[] = []
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))

function fakeAuth(over: Partial<Auth> = {}, email: string | null = null) {
  const editors = ref(['ana@iglesia.do', 'luis@iglesia.do'])
  const auth = {
    session: ref(email ? { email } : null),
    ready: Promise.resolve(),
    canSignIn: vi.fn(async (e: string) => e.trim().toLowerCase() === 'ana@iglesia.do'),
    sendCode: vi.fn(async () => {}),
    verifyCode: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    listEditors: vi.fn(async () => [...editors.value]),
    addEditor: vi.fn(async (e: string) => void editors.value.push(e.trim().toLowerCase())),
    removeEditor: vi.fn(async (e: string) => void (editors.value = editors.value.filter((x) => x !== e))),
    ...over,
  } as unknown as Auth
  return auth
}

async function render(component: object, auth: Auth, pending = 0, path = '/') {
  const state = ref<SyncState>({ status: pending ? 'pendiente' : 'sincronizado', pending, lastSyncAt: null })
  const service = { state: computed(() => state.value), syncNow: vi.fn(), start() {}, stop() {} } as unknown as SyncService
  const ctx = { service, auth, remote: {} } as unknown as SyncContext
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }] })
  await router.push(path)
  const w = mount(component, { attachTo: document.body, global: { plugins: [router, syncPlugin(shallowRef(ctx))] } })
  wrappers.push(w)
  return { w, router }
}

async function submit(w: ReturnType<typeof mount>, value: string) {
  await w.get('input').setValue(value)
  await w.get('form').trigger('submit')
  await flushPromises()
}

describe('Entrar', () => {
  it('un correo fuera del equipo no pide código y lo dice', async () => {
    const auth = fakeAuth()
    const { w } = await render(SignInPage, auth)
    await submit(w, 'extrano@correo.com')
    expect(w.text()).toContain('Este correo no está en el equipo. Pídele a alguien del equipo que te añada.')
    expect(auth.sendCode).not.toHaveBeenCalled()
  })

  it('código incorrecto muestra el mensaje y deja reintentar', async () => {
    const auth = fakeAuth({ verifyCode: vi.fn(async () => { throw new Error('El código no es correcto o ya caducó.') }) })
    const { w } = await render(SignInPage, auth)
    await submit(w, 'Ana@iglesia.do')
    expect(auth.sendCode).toHaveBeenCalledWith('Ana@iglesia.do')
    expect(w.text()).toContain('ana@iglesia.do')
    await submit(w, '123456')
    expect(w.text()).toContain('El código no es correcto o ya caducó.')
  })

  it('con el código correcto vuelve a donde estaba y pide guardar los datos', async () => {
    const persist = vi.spyOn(navigator.storage, 'persist').mockResolvedValue(true)
    const auth = fakeAuth()
    const { w, router } = await render(SignInPage, auth, 0, '/entrar?volver=/presentaciones')
    await submit(w, 'ana@iglesia.do')
    await submit(w, '654321')
    expect(auth.verifyCode).toHaveBeenCalledWith('ana@iglesia.do', '654321')
    expect(router.currentRoute.value.fullPath).toBe('/presentaciones')
    expect(persist).toHaveBeenCalled()
  })
})

describe('Equipo', () => {
  it('lista, añade y no deja quitarse a sí mismo', async () => {
    const auth = fakeAuth({}, 'ana@iglesia.do')
    const { w } = await render(TeamPage, auth)
    await flushPromises()
    expect(w.findAll('li').map((li) => li.text())).toEqual([expect.stringContaining('ana@iglesia.do'), expect.stringContaining('luis@iglesia.do')])
    const own = w.findAll('li')[0]!.get('button')
    expect(own.attributes('disabled')).toBeDefined()
    await submit(w, 'nuevo@iglesia.do')
    expect(auth.addEditor).toHaveBeenCalledWith('nuevo@iglesia.do')
    expect(w.text()).toContain('nuevo@iglesia.do')
  })

  it('quitar a otro pide confirmación', async () => {
    const auth = fakeAuth({}, 'ana@iglesia.do')
    const { w } = await render(TeamPage, auth)
    await flushPromises()
    await w.findAll('li')[1]!.get('button').trigger('click')
    expect(confirmState.request?.title).toContain('luis@iglesia.do')
    answerConfirm(true)
    await flushPromises()
    expect(auth.removeEditor).toHaveBeenCalledWith('luis@iglesia.do')
  })

  it('cerrar sesión con cambios pendientes pregunta antes', async () => {
    const auth = fakeAuth({}, 'ana@iglesia.do')
    const { w } = await render(TeamPage, auth, 2)
    await flushPromises()
    await w.findAll('button').find((b) => b.text() === 'Cerrar sesión')!.trigger('click')
    expect(confirmState.request?.title).toContain('2 cambios')
    answerConfirm(false)
    await flushPromises()
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('sin sesión invita a entrar', async () => {
    const { w } = await render(TeamPage, fakeAuth())
    await flushPromises()
    expect(w.get('a[href="/entrar?volver=/equipo"]').text()).toBe('Entrar')
  })
})
