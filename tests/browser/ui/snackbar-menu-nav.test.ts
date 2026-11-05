// Componentes nuevos de la UI móvil: snackbar, menú de tres puntos, ayuda de campo, botón con estado y barra inferior.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppBottomNav from '../../../src/app/AppBottomNav.vue'
import UiButton from '../../../src/ui/UiButton.vue'
import UiField from '../../../src/ui/UiField.vue'
import UiMenu from '../../../src/ui/UiMenu.vue'
import UiSnackbar from '../../../src/ui/UiSnackbar.vue'
import { notify, resetSnackbar } from '../../../src/ui/useSnackbar'
import { until } from '../helpers/app'
import { cleanupMounted, mountInHost } from '../helpers/mount'
import '../../../src/ui/styles.css'

afterEach(() => {
  cleanupMounted()
  resetSnackbar()
})

const flush = () => new Promise((r) => setTimeout(r, 30))
const Icon = defineComponent(() => () => h('i'))

describe('UiSnackbar', () => {
  it('normal: role status, con ✓ en éxito y barra que se vacía; sin botón de cerrar', async () => {
    const { host } = mountInHost(UiSnackbar, 390, 700)
    notify({ message: 'Listo', success: true })
    await until(() => !!host.querySelector('[data-snackbar]'))
    const bar = host.querySelector('[data-snackbar]')!
    expect(bar.getAttribute('role')).toBe('status')
    expect(bar.getAttribute('aria-live')).toBe('polite')
    expect(bar.querySelector('svg')).toBeTruthy()
    expect(bar.querySelector('[aria-label="Cerrar aviso"]')).toBeNull()
  })

  it('error: role alert y su acción Reintentar, que la cierra', async () => {
    const retry = vi.fn()
    const { host } = mountInHost(UiSnackbar, 390, 700)
    notify({ message: 'Falló', tone: 'error', action: { label: 'Reintentar', run: retry } })
    await until(() => !!host.querySelector('[data-snackbar]'))
    expect(host.querySelector('[data-snackbar]')!.getAttribute('role')).toBe('alert')
    host.querySelector<HTMLElement>('[data-snackbar-action]')!.click()
    await until(() => retry.mock.calls.length === 1)
    await until(() => !host.querySelector('[data-snackbar]'))
  })

  it('advertencia: no se va sola y el × la cierra', async () => {
    const { host } = mountInHost(UiSnackbar, 390, 700)
    notify({ message: 'Ojo', tone: 'warning' })
    await until(() => !!host.querySelector('[data-snackbar]'))
    host.querySelector<HTMLElement>('[aria-label="Cerrar aviso"]')!.click()
    await until(() => !host.querySelector('[data-snackbar]'))
  })
})

describe('UiMenu', () => {
  const Menu = defineComponent(() => {
    const picked = ref('')
    const items = [
      { key: 'a', label: 'Uno', icon: Icon },
      { key: 'b', label: 'Dos', icon: Icon, danger: true, separatorBefore: true },
    ]
    return () => h('div', [h(UiMenu, { label: 'Acciones', items, onSelect: (k: string) => (picked.value = k) }), h('output', picked.value)])
  })

  it('abre con el botón (aria-expanded), elige una acción y se cierra', async () => {
    const { host } = mountInHost(Menu, 390, 700)
    const trigger = host.querySelector<HTMLElement>('[aria-haspopup="menu"]')!
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    trigger.click()
    await until(() => !!document.querySelector('[role="menu"]'))
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    document.querySelector<HTMLElement>('[data-menu-item="b"]')!.click()
    await until(() => host.querySelector('output')!.textContent === 'b')
    await until(() => !document.querySelector('[role="menu"]'))
  })

  it('Esc lo cierra y devuelve el foco al botón', async () => {
    const { host } = mountInHost(Menu, 390, 700)
    const trigger = host.querySelector<HTMLElement>('[aria-haspopup="menu"]')!
    trigger.click()
    await until(() => document.activeElement?.getAttribute('role') === 'menuitem')
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await until(() => !document.querySelector('[role="menu"]'))
    expect(document.activeElement).toBe(trigger)
  })

  it('un toque fuera lo cierra', async () => {
    const { host } = mountInHost(Menu, 390, 700)
    host.querySelector<HTMLElement>('[aria-haspopup="menu"]')!.click()
    await until(() => !!document.querySelector('[role="menu"]'))
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await until(() => !document.querySelector('[role="menu"]'))
  })
})

describe('UiField: ayuda y error', () => {
  it('la ayuda es un ícono con tooltip: oculto al inicio, visible al tocar, Esc lo cierra', async () => {
    const { host } = mountInHost(
      defineComponent(() => () => h(UiField, { id: 'campo-x', label: 'Título', hint: 'Lo que más se ve.' }, { default: () => h('input', { id: 'campo-x' }) })),
      360,
      300,
    )
    const help = host.querySelector<HTMLElement>('[data-field-help]')!
    const tip = host.querySelector<HTMLElement>('[role="tooltip"]')!
    expect(help.getAttribute('aria-label')).toBe('Ayuda: Título')
    expect(tip.textContent?.trim()).toBe('Lo que más se ve.')
    expect(getComputedStyle(tip).display).toBe('none')
    help.click()
    await until(() => getComputedStyle(tip).display !== 'none')
    help.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await until(() => getComputedStyle(tip).display === 'none')
  })

  it('un error nuevo abre la zona del mensaje; sin error queda cerrada (inert)', async () => {
    const error = ref<string | undefined>(undefined)
    const { host } = mountInHost(
      defineComponent(() => () => h(UiField, { id: 'campo-x', label: 'T', error: error.value }, { default: () => h('input', { id: 'campo-x' }) })),
      360,
      300,
    )
    expect(host.querySelector('[inert]')).toBeTruthy()
    error.value = 'Escribe un título.'
    await until(() => !host.querySelector('[inert]'))
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('Escribe un título.')
  })
})

describe('UiButton con estado', () => {
  it('cargando: deshabilitado, aria-busy y el texto sigue (invisible) para no cambiar el ancho; hecho: ✓', async () => {
    const state = ref<'idle' | 'loading' | 'done'>('loading')
    const { host } = mountInHost(
      defineComponent(() => () => h(UiButton, { busy: state.value }, () => 'Guardar')),
      300,
      100,
    )
    const b = host.querySelector('button')!
    expect(b.disabled).toBe(true)
    expect(b.getAttribute('aria-busy')).toBe('true')
    expect(b.textContent).toContain('Guardar')
    state.value = 'done'
    await flush()
    expect(b.querySelector('svg')).toBeTruthy()
    state.value = 'idle'
    await flush()
    expect(b.disabled).toBe(false)
  })
})

describe('AppBottomNav', () => {
  async function nav(path: string) {
    const stub = { render: () => null }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'inicio', component: stub },
        { path: '/anuncios', name: 'anuncios', component: stub },
        { path: '/anuncios/:id', name: 'editar', component: stub },
        { path: '/presentaciones', name: 'presentaciones', component: stub },
        { path: '/configuracion', name: 'configuracion', component: stub },
        { path: '/entrar', name: 'entrar', component: stub },
      ],
    })
    await router.push(path)
    return mountInHost(AppBottomNav, 390, 700, { global: { plugins: [router] } }).host
  }
  const current = (host: HTMLElement) => [...host.querySelectorAll('a[aria-current="page"]')].map((a) => a.textContent?.trim())

  it('Inicio, Anuncios, Presentar y Ajustes, y marca el de la ruta (el editor cuelga de Anuncios)', async () => {
    const host = await nav('/anuncios/abc')
    expect([...host.querySelectorAll('a')].map((a) => a.textContent?.trim())).toEqual(['Inicio', 'Anuncios', 'Presentar', 'Ajustes'])
    expect(current(host)).toEqual(['Anuncios'])
  })

  it('una ruta sin destino no marca ninguno', async () => {
    expect(current(await nav('/entrar'))).toEqual([])
  })
})
