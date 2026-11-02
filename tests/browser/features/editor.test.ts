import { afterEach, describe, expect, it } from 'vitest'
import { NORMAL } from '../../fixtures/announcements'
import { byLabel, cleanupDbs, daysFromToday, mountApp, seed, testDb, until } from '../helpers/app'
import { cleanupMounted, frame } from '../helpers/mount'

afterEach(async () => {
  cleanupMounted()
  await cleanupDbs()
})

const slideTitle = (host: HTMLElement) => host.querySelector<HTMLElement>('[data-preview] [data-role="title"]')
const input = (host: HTMLElement, key: string) => host.querySelector<HTMLInputElement>(`#campo-${key}`)!
function type(el: HTMLInputElement, text: string) {
  el.value = text
  el.dispatchEvent(new Event('input', { bubbles: true }))
}
const dialog = () => document.querySelector<HTMLDialogElement>('dialog[open]')

async function newCulto(db = testDb()) {
  const app = await mountApp('/anuncios/nuevo/culto', db)
  await until(() => !!input(app.host, 'titulo'))
  type(input(app.host, 'titulo'), 'Culto joven')
  type(input(app.host, 'fecha'), daysFromToday(5))
  type(input(app.host, 'hora'), '19:00')
  await until(() => slideTitle(app.host)?.textContent === 'Culto joven')
  return { ...app, db }
}

const clickSave = (host: HTMLElement) => byLabel(host, 'Guardar')!.click()

describe('editor con vista previa (RF-03, RNF-04)', () => {
  it('escribir el título actualiza la slide en menos de 200 ms', async () => {
    const { host } = await newCulto()
    const t0 = performance.now()
    type(input(host, 'titulo'), 'Vigilia de oración')
    await until(() => slideTitle(host)?.textContent === 'Vigilia de oración')
    expect(performance.now() - t0).toBeLessThan(200)
  })

  it('un título que no cabe → banda "No cabe: Título" y el mensaje de RF-10 en el campo', async () => {
    const { host } = await newCulto()
    // El motor decide (hasta 4 líneas de título): 88 caracteres aún caben; 174, no.
    type(
      input(host, 'titulo'),
      'Gran concierto de alabanza y adoración con coros invitados de toda la región este sábado por la noche en el templo central con la participación especial de muchos ministerios',
    )
    await until(() => !!host.querySelector('[data-fit-status="no_cabe"]'), 8000)
    expect(host.querySelector('[data-fit-status="no_cabe"]')!.textContent).toContain('No cabe: Título')
    expect(host.textContent).toContain('Este texto es muy largo para leerse bien desde lejos; acórtalo o muévelo a las notas del presentador')
    expect(input(host, 'titulo').getAttribute('aria-invalid')).toBe('true')
  })

  it('guardar un culto válido → listo, con su fecha, y la ruta pasa a editar/:id', async () => {
    const { host, router, db } = await newCulto()
    clickSave(host)
    await until(() => router.currentRoute.value.name === 'editar')
    const saved = await db.announcements.get(router.currentRoute.value.params.id as string)
    expect(saved).toMatchObject({ status: 'listo', eventDate: daysFromToday(5), typeId: 'culto' })
    await until(() => host.textContent!.includes('Guardado'))
  })

  // Revisión final P4: guardar al instante tras cambiar de estilo no puede guardar "listo" algo que no cabe.
  it('cambiar a un estilo donde el título no cabe y guardar enseguida → no_cabe', async () => {
    const { host, router, db } = await newCulto()
    byLabel(host, /^Himnario/)!.click()
    // 92 caracteres: caben en Himnario, no en Cartel (medido con el motor).
    type(input(host, 'titulo'), 'Gran concierto de alabanza y adoración con coros invitados de toda la región este sábado por')
    await until(() => host.querySelector('[data-fit-status]')?.getAttribute('data-fit-status') === 'ok', 8000)
    byLabel(host, /^Cartel/)!.click()
    clickSave(host)
    await until(() => router.currentRoute.value.name === 'editar', 8000)
    expect((await db.announcements.get(router.currentRoute.value.params.id as string))?.status).toBe('no_cabe')
  })

  it('guardar algo que no valida dice que quedó como borrador (RF-10)', async () => {
    const { host, router } = await mountApp('/anuncios/nuevo/culto', testDb())
    await until(() => !!input(host, 'titulo'))
    type(input(host, 'titulo'), 'Solo el título')
    clickSave(host)
    await until(() => router.currentRoute.value.name === 'editar')
    await until(() => host.textContent!.includes('Guardado como borrador'))
  })

  it('Ctrl+S dentro del título guarda', async () => {
    const { host, router } = await newCulto()
    input(host, 'titulo').dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }))
    await until(() => router.currentRoute.value.name === 'editar')
  })

  it('un anuncio guardado que ya no valida abre con los errores en sus campos', async () => {
    const db = testDb()
    const a = await seed(db, { typeId: 'culto', values: { titulo: 'Sin fecha', fecha: 'no-es-fecha' }, status: 'borrador' })
    const { host } = await mountApp(`/anuncios/${a.id}`, db)
    await until(() => !!input(host, 'fecha'))
    await frame()
    expect(input(host, 'fecha').getAttribute('aria-invalid')).toBe('true')
    expect(input(host, 'hora').getAttribute('aria-invalid')).toBe('true')
    expect(input(host, 'titulo').value).toBe('Sin fecha')
  })

  it('un anuncio que no existe → mensaje y enlace a la lista', async () => {
    const { host } = await mountApp('/anuncios/no-existe', testDb())
    await until(() => host.textContent!.includes('No encontramos este anuncio.'))
    expect(byLabel(host, 'Ver anuncios')).toBeTruthy()
  })

  it('duplicado: abre con el foco en la fecha', async () => {
    const db = testDb()
    const a = await seed(db, { typeId: 'culto', values: { ...NORMAL.culto } })
    const { host } = await mountApp(`/anuncios/${a.id}?foco=fecha`, db)
    await until(() => document.activeElement === input(host, 'fecha'))
  })
})

describe('opciones de la slide (§6.3)', () => {
  it('cambiar de estilo cambia la slide', async () => {
    const { host } = await newCulto()
    const before = host.querySelector('[data-preview]')!.innerHTML
    byLabel(host, /^Cartel/)!.click()
    await until(() => host.querySelector('[data-preview]')!.innerHTML !== before)
  })

  it('logo "Ninguno" quita el logo de la slide', async () => {
    const { host } = await newCulto()
    await until(() => !!host.querySelector('[data-preview] [data-logo]'))
    byLabel(host, 'Ninguno')!.click()
    await until(() => !host.querySelector('[data-preview] [data-logo]'))
  })

  it('un color propio que hay que ajustar muestra el aviso', async () => {
    const { host } = await newCulto()
    const color = host.querySelector<HTMLInputElement>('input[type="color"]')!
    color.value = '#777777'
    color.dispatchEvent(new Event('input', { bubbles: true }))
    await until(() => host.textContent!.includes('Ajustamos el color para que el texto se lea bien en la pantalla.'))
  })

  // Revisión final P4: de un anuncio a otro (mismo registro de ruta) también se pregunta.
  it('con cambios sin guardar, pasar a otro anuncio pide confirmación', async () => {
    const db = testDb()
    const a = await seed(db, { typeId: 'culto', values: { ...NORMAL.culto, titulo: 'Primero' } })
    const b = await seed(db, { typeId: 'culto', values: { ...NORMAL.culto, titulo: 'Segundo' } })
    const { host, router } = await mountApp(`/anuncios/${a.id}`, db)
    await until(() => input(host, 'titulo')?.value === 'Primero')
    type(input(host, 'titulo'), 'Primero cambiado')
    void router.push(`/anuncios/${b.id}`)
    await until(() => !!dialog())
    byLabel(dialog()!, 'Cancelar')!.click()
    await until(() => !dialog())
    expect(router.currentRoute.value.params.id).toBe(a.id)
    expect(input(host, 'titulo').value).toBe('Primero cambiado')
  })

  it('con cambios sin guardar, ir a Inicio pide confirmación', async () => {
    const { host, router } = await newCulto()
    byLabel(host, 'Inicio')!.click()
    await until(() => !!dialog())
    expect(dialog()!.textContent).toContain('¿Salir sin guardar?')
    byLabel(dialog()!, 'Cancelar')!.click()
    await until(() => !dialog())
    expect(router.currentRoute.value.name).toBe('nuevo-tipo')
  })
})
