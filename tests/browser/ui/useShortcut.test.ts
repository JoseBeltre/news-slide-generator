import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useShortcut } from '../../../src/ui/useShortcut'
import { cleanupMounted, mountInHost } from '../helpers/mount'

afterEach(cleanupMounted)

function mountWith(keys: string, opts?: { allowInFields?: boolean }) {
  const handler = vi.fn()
  const Comp = defineComponent({
    setup() {
      useShortcut(keys, handler, opts)
      return () => h('input')
    },
  })
  const { wrapper, host } = mountInHost(Comp, 200, 100)
  return { handler, wrapper, input: host.querySelector('input')! }
}

const press = (target: EventTarget, key: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(e)
  return e
}

describe('useShortcut', () => {
  it('"n" fuera de un campo llama al handler', () => {
    const { handler } = mountWith('n')
    press(document.body, 'n')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('"n" escrito dentro de un campo no llama', () => {
    const { handler, input } = mountWith('n')
    press(input, 'n')
    expect(handler).not.toHaveBeenCalled()
  })

  it('"mod+s" con Ctrl llama dentro de un campo si se permite, y evita el guardar del navegador', () => {
    const { handler, input } = mountWith('mod+s', { allowInFields: true })
    const e = press(input, 's', { ctrlKey: true })
    expect(handler).toHaveBeenCalledOnce()
    expect(e.defaultPrevented).toBe(true)
  })

  it('"n" con Ctrl no cuenta como "n"', () => {
    const { handler } = mountWith('n')
    press(document.body, 'n', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('al desmontar deja de escuchar', () => {
    const { handler, wrapper } = mountWith('n')
    wrapper.unmount()
    press(document.body, 'n')
    expect(handler).not.toHaveBeenCalled()
  })
})
