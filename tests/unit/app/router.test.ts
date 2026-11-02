import { createMemoryHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../../../src/app/router'

async function go(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  return router.currentRoute.value
}

describe('rutas de la app', () => {
  it('/anuncios/nuevo/culto → paso 2 del tipo culto', async () => {
    const r = await go('/anuncios/nuevo/culto')
    expect(r.name).toBe('nuevo-tipo')
    expect(r.params.typeId).toBe('culto')
  })

  it('un tipo que no existe vuelve al paso 1', async () => {
    expect((await go('/anuncios/nuevo/no-existe')).name).toBe('nuevo')
  })

  it('/anuncios/abc → editor del anuncio abc', async () => {
    const r = await go('/anuncios/abc')
    expect(r.name).toBe('editar')
    expect(r.params.id).toBe('abc')
  })

  it('/anuncios → lista; una ruta desconocida → inicio', async () => {
    expect((await go('/anuncios')).name).toBe('anuncios')
    expect((await go('/presentacion/cualquier-cosa')).name).toBe('inicio')
  })
})
