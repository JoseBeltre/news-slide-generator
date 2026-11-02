import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import UiConfirm from '../../../src/ui/UiConfirm.vue'
import { useConfirm } from '../../../src/ui/useConfirm'
import { cleanupMounted, mountInHost } from '../helpers/mount'
import { until } from '../helpers/slides'

afterEach(cleanupMounted)

function setup() {
  let answer: Promise<boolean> | undefined
  const Comp = defineComponent({
    setup() {
      const confirm = useConfirm()
      const ask = () => (answer = confirm({ title: '¿Eliminar «Culto»?', confirmLabel: 'Eliminar', danger: true }))
      return () => [h('button', { id: 'abrir', onClick: ask }, 'Abrir'), h(UiConfirm)]
    },
  })
  const { host } = mountInHost(Comp, 400, 300)
  const opener = host.querySelector<HTMLButtonElement>('#abrir')!
  opener.focus()
  opener.click()
  return { opener, answer: () => answer!, dialog: () => host.querySelector<HTMLDialogElement>('dialog')! }
}

describe('UiConfirm', () => {
  it('muestra el título y devuelve true al confirmar', async () => {
    const { answer, dialog } = setup()
    await until(() => dialog().open)
    expect(dialog().textContent).toContain('¿Eliminar «Culto»?')
    ;[...dialog().querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Eliminar')!.click()
    await expect(answer()).resolves.toBe(true)
  })

  it('Cancelar devuelve false y el foco vuelve al botón que lo abrió', async () => {
    const { answer, dialog, opener } = setup()
    await until(() => dialog().open)
    ;[...dialog().querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Cancelar')!.click()
    await expect(answer()).resolves.toBe(false)
    await until(() => !dialog().open)
    expect(document.activeElement).toBe(opener)
  })

  it('Esc devuelve false', async () => {
    const { answer, dialog } = setup()
    await until(() => dialog().open)
    dialog().dispatchEvent(new Event('cancel', { cancelable: true }))
    await expect(answer()).resolves.toBe(false)
  })
})
