import { expect, test } from '@playwright/test'

test('no hace ninguna solicitud a otro origen (C-03)', async ({ page, baseURL }) => {
  const origen = new URL(baseURL!).origin
  const externas: string[] = []
  page.on('request', (r) => {
    if (new URL(r.url()).origin !== origen) externas.push(r.url())
  })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  expect(externas).toEqual([])
})

test('funciona sin red después de la primera carga, también en rutas profundas', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload() // la página queda controlada por el Service Worker
  await context.setOffline(true)
  await page.goto('/presentacion/cualquier-cosa')
  await expect(page.getByRole('link', { name: 'Anuncios del Sábado' })).toBeVisible()
  await page.goto('/anuncios')
  await expect(page.getByRole('heading', { name: 'Anuncios', level: 1 })).toBeVisible()
  // load() obliga a descargar el woff2: sin red solo puede venir del precache.
  const caras = await page.evaluate(async () => {
    const r400 = await document.fonts.load('400 100px "Atkinson Hyperlegible"')
    const r700 = await document.fonts.load('700 100px "Atkinson Hyperlegible"')
    const inter = await document.fonts.load('16px "Inter Variable"')
    const serif = await document.fonts.load('400 32px "Instrument Serif"')
    return [r400.length, r700.length, inter.length, serif.length]
  })
  expect(caras.every((n) => n > 0)).toBe(true)
})

test('la primera visita ya queda guardada para usarse sin red, sin recargar', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 5_000 }).toBe(true)
})
