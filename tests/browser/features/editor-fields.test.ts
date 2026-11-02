import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import { dbPlugin } from '../../../src/data/useDb'
import AnnouncementForm from '../../../src/features/announcements/editor/form/AnnouncementForm.vue'
import { getTypeDef } from '../../../src/slides/types/definitions'
import type { AnnouncementTypeId } from '../../../src/slides/types/fields'
import { validateValues } from '../../../src/slides/types/validation'
import { syntheticFlyer } from '../../fixtures/images'
import { cleanupDbs, testDb, until } from '../helpers/app'
import { cleanupMounted, frame, mountInHost } from '../helpers/mount'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

function mountForm(typeId: AnnouncementTypeId, opts: { values?: Record<string, unknown>; errors?: Record<string, string>; submitted?: boolean } = {}) {
  const db = testDb()
  const state = reactive({ values: { ...opts.values } as Record<string, unknown> })
  const Comp = defineComponent(() => () =>
    h(AnnouncementForm, {
      typeDef: getTypeDef(typeId),
      values: state.values,
      errors: opts.errors ?? {},
      submitted: opts.submitted ?? false,
      'onUpdate:field': (key: string, v: unknown) => (state.values[key] = v),
    }),
  )
  const { host } = mountInHost(Comp, 800, 1600, { global: { plugins: [dbPlugin(db)] } })
  return { host, state, db }
}

const field = (host: HTMLElement, key: string) => host.querySelector<HTMLInputElement>(`#campo-${key}`)!
function type(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  el.value = text
  el.dispatchEvent(new Event('input', { bubbles: true }))
}
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

async function upload(input: HTMLInputElement, blob: Blob) {
  const dt = new DataTransfer()
  dt.items.add(new File([blob], 'imagen.png', { type: blob.type }))
  input.files = dt.files
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('formulario generado desde FieldDef (RF-01, RF-04)', () => {
  it('culto: los campos en su orden, con "*" en los obligatorios', () => {
    const { host } = mountForm('culto')
    const labels = [...host.querySelectorAll('label[data-field-label]')].map((l) => l.textContent!.trim())
    const def = getTypeDef('culto')
    expect(labels.map((l) => l.replace(/\s*\*$/, ''))).toEqual(def.fields.map((f) => f.label))
    def.fields.forEach((f, i) => expect(labels[i]!.endsWith('*')).toBe(f.required))
  })

  it('57 de 60 caracteres en el título → contador en aviso', async () => {
    const { host } = mountForm('culto')
    type(field(host, 'titulo'), 'x'.repeat(57))
    await frame()
    const counter = host.querySelector<HTMLElement>('[data-counter]')!
    expect(counter.textContent).toBe('57/60')
    expect(counter.className).toContain('text-warning')
  })

  it('precio "1,500" → 1500', async () => {
    const { host, state } = mountForm('salida')
    type(field(host, 'precio'), '1,500')
    await until(() => state.values.precio === 1500)
  })

  it('lista: Enter y coma agregan; Backspace en vacío quita el último', async () => {
    const { host, state } = mountForm('salida')
    const input = field(host, 'queLlevar')
    type(input, 'Agua')
    key(input, 'Enter')
    type(input, 'Gorra')
    key(input, ',')
    await until(() => (state.values.queLlevar as string[] | undefined)?.length === 2)
    expect(state.values.queLlevar).toEqual(['Agua', 'Gorra'])
    key(input, 'Backspace')
    await until(() => (state.values.queLlevar as string[]).length === 1)
  })

  it('imagen: subir guarda y emite el id; la misma foto otra vez da el mismo id; Quitar no borra el blob', async () => {
    const { host, state, db } = mountForm('culto')
    const input = host.querySelector<HTMLInputElement>('[data-image-input="fotoPredicador"]')!
    const blob = await syntheticFlyer(800, 1000)
    await upload(input, blob)
    await until(() => typeof state.values.fotoPredicador === 'string')
    const first = state.values.fotoPredicador
    await until(() => !!host.querySelector('[data-image-preview="fotoPredicador"]'))
    await upload(host.querySelector<HTMLInputElement>('[data-image-input="fotoPredicador"]')!, blob)
    await frame()
    await until(() => state.values.fotoPredicador === first)
    expect(await db.images.count()).toBe(1)
    ;[...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Quitar')!.click()
    await until(() => state.values.fotoPredicador === undefined)
    expect(await db.imageBlobs.count()).toBe(1)
  })

  async function flyerWarning(width: number, height: number) {
    const { host, state } = mountForm('imagen')
    await upload(host.querySelector<HTMLInputElement>('[data-image-input="imagen"]')!, await syntheticFlyer(width, height))
    await until(() => typeof state.values.imagen === 'string')
    await until(() => !!host.querySelector('[data-image-preview="imagen"]'))
    await frame()
    return host.querySelector('[data-banner="warning"]')?.textContent ?? null
  }

  it('flyer de 1080 px de ancho → aviso de baja resolución, sin bloquear (RF-42)', async () => {
    expect(await flyerWarning(1080, 1920)).toContain('1080 px')
  })

  it('flyer de 1920 px de ancho → sin aviso', async () => {
    expect(await flyerWarning(1920, 1080)).toBeNull()
  })

  it('personas: agregar dos da dos Person válidas, y nada pide año ni edad (§3.3)', async () => {
    const { host, state } = mountForm('cumpleanos', { values: { modo: 'grupo' } })
    const add = () => [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Agregar persona')!.click()
    add()
    await frame()
    add()
    await frame()
    const names = host.querySelectorAll<HTMLInputElement>('[data-person-name]')
    expect(names).toHaveLength(2)
    type(names[0]!, 'Ana')
    type(names[1]!, 'Luis')
    await until(() => (state.values.personas as { name: string }[])?.every((p) => p.name))
    const personas = state.values.personas as unknown[]
    expect(personas).toHaveLength(2)
    expect(validateValues(getTypeDef('cumpleanos'), { modo: 'grupo', personas }).ok).toBe(true)
    const people = host.querySelector('[data-people]')!
    const texts = [...people.querySelectorAll('label, [aria-label], option, legend')].map((el) => `${el.textContent} ${el.getAttribute('aria-label') ?? ''}`)
    expect(texts.some((t) => /\baño\b|\bedad\b/i.test(t))).toBe(false)
  })

  it('un error de validación aparece bajo su campo con aria-invalid (tras intentar guardar)', () => {
    const { host } = mountForm('culto', { errors: { titulo: 'Este campo es obligatorio.' }, submitted: true })
    const input = field(host, 'titulo')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(host.textContent).toContain('Este campo es obligatorio.')
  })

  // Revisión final P4: los errores de cada persona (personas.0.name, personas.1) se ven en su fila.
  it('personas: cada error aparece en su campo, con aria-invalid', () => {
    const personas = [{ name: '', day: 31, month: 2 }, { name: 'Luis', day: 9, month: 13 }]
    const errors = { 'personas.0.name': 'Escribe el nombre.', 'personas.0': 'Ese día no existe en ese mes.', 'personas.1.month': 'El día o el mes no es válido.' }
    const { host } = mountForm('cumpleanos', { values: { modo: 'grupo', personas }, errors, submitted: true })
    const names = host.querySelectorAll<HTMLInputElement>('[data-person-name]')
    expect(names[0]!.getAttribute('aria-invalid')).toBe('true')
    expect(names[1]!.getAttribute('aria-invalid')).not.toBe('true')
    const text = host.querySelector('[data-people]')!.textContent!
    for (const m of Object.values(errors)) expect(text).toContain(m)
    expect(host.querySelector<HTMLSelectElement>('#campo-personas-2-mes')!.getAttribute('aria-invalid')).toBe('true')
  })

  it('antes de salir del campo o de guardar, el error no se muestra', async () => {
    const { host } = mountForm('culto', { errors: { titulo: 'Este campo es obligatorio.' } })
    expect(host.textContent).not.toContain('Este campo es obligatorio.')
    field(host, 'titulo').dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await frame()
    expect(host.textContent).toContain('Este campo es obligatorio.')
  })
})
