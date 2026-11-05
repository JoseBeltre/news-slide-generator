import { createMemoryHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../../../src/app/router'

/** Solo resuelve la ruta (sin cargar la pantalla, que trae el motor de slides). */
const resolve = (path: string) => createAppRouter(createMemoryHistory()).resolve(path)

/** Navega: corre las guardas y redirecciones. */
async function go(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  return router.currentRoute.value
}

describe('rutas de la app', () => {
  it('/anuncios/nuevo/culto → paso 2 del tipo culto', async () => {
    const r = resolve('/anuncios/nuevo/culto')
    expect(r.name).toBe('nuevo-tipo')
    expect(r.params.typeId).toBe('culto')
  })

  it('un tipo que no existe vuelve al paso 1', async () => {
    expect((await go('/anuncios/nuevo/no-existe')).name).toBe('nuevo')
  })

  it('/anuncios/publico no abre el editor', () => {
    const r = resolve('/anuncios/publico')
    expect(r.name).toBe('anuncios-publico')
  })

  it('/anuncios/abc → editor del anuncio abc', async () => {
    const r = resolve('/anuncios/abc')
    expect(r.name).toBe('editar')
    expect(r.params.id).toBe('abc')
  })

  it('/anuncios → lista; una ruta desconocida → inicio', async () => {
    expect((await go('/anuncios')).name).toBe('anuncios')
    expect((await go('/presentacion/cualquier-cosa')).name).toBe('inicio')
  })

  it('Entrar va sin el marco de la app (sin encabezado)', () => {
    expect(resolve('/entrar').meta.bare).toBe(true)
    expect(resolve('/configuracion').meta.bare).toBeFalsy()
  })

  it('sin nube configurada, /entrar vuelve a inicio', async () => {
    expect(resolve('/entrar').name).toBe('entrar')
    expect((await go('/entrar')).name).toBe('inicio')
  })

  it('/equipo lleva a la sección Equipo de Configuración', async () => {
    expect((await go('/equipo')).fullPath).toBe('/configuracion#equipo')
  })
})
