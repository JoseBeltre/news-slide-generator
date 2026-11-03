// Identidad contra el build: el manifiesto (iconos sin fondo para escritorio y con fondo para el móvil,
// accesos directos) y los archivos que piden los navegadores y la vista previa al compartir.
import { expect, test } from '@playwright/test'

test('manifiesto de la app instalable', async ({ request }) => {
  const m = await (await request.get('/manifest.webmanifest')).json()
  expect(m).toMatchObject({
    id: '/',
    start_url: '/',
    name: 'Anuncios del Sábado · Mansedumbre II',
    short_name: 'Anuncios',
    lang: 'es-DO',
    background_color: '#F3F0D6',
    theme_color: '#1A1A1A',
  })
  expect(m.description).toMatch(/Mansedumbre II/)
  expect(m.icons).toEqual([
    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ])
  expect(m.shortcuts.map((s: { name: string; url: string }) => [s.name, s.url])).toEqual([
    ['Nuevo anuncio', '/anuncios/nuevo'],
    ['Presentaciones', '/presentaciones'],
  ])
})

test('iconos, robots.txt e imagen para compartir responden', async ({ request, page }) => {
  for (const path of ['/favicon.ico', '/icon.svg', '/apple-touch-icon-180x180.png', '/pwa-512x512.png', '/maskable-icon-512x512.png'])
    expect((await request.get(path)).status(), path).toBe(200)
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /')
  await page.goto('/og.png')
  const size = await page.evaluate(() => [document.images[0]!.naturalWidth, document.images[0]!.naturalHeight])
  expect(size).toEqual([1200, 630])
})
