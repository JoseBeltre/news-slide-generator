import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import UiField from '../../../src/ui/UiField.vue'
import UiInput from '../../../src/ui/UiInput.vue'
import { cleanupMounted, mountInHost } from '../helpers/mount'

afterEach(cleanupMounted)

function mountField(props: { count?: number; max?: number; error?: string; required?: boolean }) {
  const Comp = defineComponent(() => () =>
    h(UiField, { id: 'campo-titulo', label: 'Título', ...props }, {
      default: ({ describedBy, invalid }: { describedBy?: string; invalid: boolean }) =>
        h(UiInput, { id: 'campo-titulo', modelValue: '', 'aria-describedby': describedBy, 'aria-invalid': invalid }),
    }),
  )
  return mountInHost(Comp, 400, 200).host
}

const counter = (host: HTMLElement) => host.querySelector<HTMLElement>('[data-counter]')!

describe('UiField', () => {
  it('etiqueta ligada al campo y "*" si es obligatorio', () => {
    const host = mountField({ required: true })
    const label = host.querySelector('label')!
    expect(label.getAttribute('for')).toBe('campo-titulo')
    expect(label.textContent).toContain('*')
  })

  it('contador: normal, aviso desde el 90 % y peligro al llegar al máximo', () => {
    expect(counter(mountField({ count: 53, max: 60 })).className).toContain('text-ink-muted')
    const warn = counter(mountField({ count: 54, max: 60 }))
    expect(warn.textContent).toBe('54/60')
    expect(warn.className).toContain('text-warning')
    expect(counter(mountField({ count: 60, max: 60 })).className).toContain('text-danger')
  })

  it('el error va debajo, con ícono, y el campo lo anuncia (aria)', () => {
    const host = mountField({ error: 'Este campo es obligatorio.' })
    const input = host.querySelector('input')!
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const msg = document.getElementById(input.getAttribute('aria-describedby')!.split(' ').at(-1)!)!
    expect(msg.textContent).toContain('Este campo es obligatorio.')
    expect(msg.querySelector('svg')).toBeTruthy()
  })
})
