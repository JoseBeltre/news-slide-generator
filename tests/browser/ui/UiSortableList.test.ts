import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import '../../../src/ui/styles.css'
import UiSortableList from '../../../src/ui/UiSortableList.vue'
import { cleanupMounted, mountInHost } from '../helpers/mount'

afterEach(cleanupMounted)

function setup() {
  const items = ref(['Culto joven', 'Excursión', 'Ayuno'])
  const moves: [number, number][] = []
  const Comp = defineComponent({
    setup() {
      const onMove = (from: number, to: number) => {
        moves.push([from, to])
        const copy = [...items.value]
        copy.splice(to, 0, ...copy.splice(from, 1))
        items.value = copy
      }
      return () =>
        h(
          UiSortableList<string>,
          { items: items.value, itemKey: (s: string) => s, itemLabel: (s: string) => s, label: 'Orden de los anuncios', onMove },
          { default: ({ item }: { item: string }) => h('span', item) },
        )
    },
  })
  const { host } = mountInHost(Comp, 600, 400)
  const button = (name: string) => host.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!
  const rows = () => [...host.querySelectorAll('li')].map((li) => li.textContent)
  return { host, moves, button, rows }
}

describe('UiSortableList (RF-51)', () => {
  it('una <ol> con nombre; "Bajar" mueve y el foco sigue a la fila', async () => {
    const { host, moves, button, rows } = setup()
    expect(host.querySelector('ol')!.getAttribute('aria-label')).toBe('Orden de los anuncios')
    button('Bajar «Culto joven»').focus()
    button('Bajar «Culto joven»').click()
    await nextTick()
    await nextTick()
    expect(moves).toEqual([[0, 1]])
    expect(rows()[1]).toContain('Culto joven')
    expect(document.activeElement).toBe(button('Bajar «Culto joven»'))
  })

  it('primera fila no sube, última no baja; zonas táctiles de 44 px', () => {
    const { button } = setup()
    expect(button('Subir «Culto joven»').disabled).toBe(true)
    expect(button('Bajar «Ayuno»').disabled).toBe(true)
    expect(button('Subir «Ayuno»').disabled).toBe(false)
    expect(button('Subir «Ayuno»').getBoundingClientRect().height).toBeGreaterThanOrEqual(40)
  })

  it('arrastrar la fila 2 y soltar sobre la 0 → move(2, 0)', async () => {
    const { host, moves } = setup()
    const li = host.querySelectorAll('li')
    const data = new DataTransfer()
    li[2]!.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: data }))
    li[0]!.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    li[0]!.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    await nextTick()
    expect(moves).toEqual([[2, 0]])
  })
})
