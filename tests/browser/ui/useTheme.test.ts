import { afterEach, describe, expect, it } from 'vitest'
import '../../../src/ui/styles.css'
import { THEME_STORAGE_KEY, applySavedTheme, useTheme } from '../../../src/ui/useTheme'
import UiThemeToggle from '../../../src/ui/UiThemeToggle.vue'
import { cleanupMounted, mountInHost } from '../helpers/mount'

const root = document.documentElement

afterEach(() => {
  cleanupMounted()
  localStorage.removeItem(THEME_STORAGE_KEY)
  delete root.dataset.theme
})

describe('tema de la interfaz', () => {
  it('oscuro y claro forzados cambian los tokens', () => {
    useTheme().set('oscuro')
    expect(root.dataset.theme).toBe('dark')
    expect(getComputedStyle(root).colorScheme).toBe('dark')
    useTheme().set('claro')
    expect(root.dataset.theme).toBe('light')
    expect(getComputedStyle(root).colorScheme).toBe('light')
  })

  it('sistema quita data-theme y se recuerda entre visitas', () => {
    useTheme().set('oscuro')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('oscuro')
    delete root.dataset.theme
    applySavedTheme()
    expect(root.dataset.theme).toBe('dark')
    useTheme().set('sistema')
    expect(root.dataset.theme).toBeUndefined()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('el botón recorre sistema → claro → oscuro y dice el tema actual', async () => {
    useTheme().set('sistema')
    const { wrapper } = mountInHost(UiThemeToggle, 200, 60)
    const btn = wrapper.get('button')
    expect(btn.attributes('aria-label')).toBe('Tema: del sistema. Cambiar a claro')
    expect(btn.classes()).toContain('cursor-pointer')
    await btn.trigger('click')
    expect(root.dataset.theme).toBe('light')
    await btn.trigger('click')
    expect(root.dataset.theme).toBe('dark')
    const probe = document.body.appendChild(document.createElement('div'))
    probe.style.background = 'var(--color-background)'
    expect(getComputedStyle(probe).backgroundColor).toBe('rgb(10, 10, 10)')
    probe.remove()
    await btn.trigger('click')
    expect(root.dataset.theme).toBeUndefined()
  })
})
