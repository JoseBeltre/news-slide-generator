// Página pública de anuncios (P9): se sirve en /anuncios/publico con sus metas propias (imagen "A",
// indexable), no carga la app del equipo y abre sin internet tras una visita. El build de E2E no tiene
// nube: la página dice que no pudo cargar (el dibujo con datos lo cubren las pruebas browser).
import { expect, test } from '@playwright/test'

test('/anuncios/publico sirve la página pública con sus metas', async ({ page }) => {
  await page.goto('/anuncios/publico')
  await expect(page.getByRole('heading', { name: 'Anuncios', level: 1 })).toBeVisible()
  await expect(page.getByText('No se pudieron cargar los anuncios. Prueba más tarde.')).toBeVisible()
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(/\/og-publico\.png$/)
  expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe('index, follow')
  expect(page.url()).toMatch(/\/anuncios\/publico$/)
})

test('el HTML público no registra la app ni enlaza su manifiesto', async ({ request }) => {
  const html = await (await request.get('/anuncios/publico')).text()
  expect(html).toContain('Anuncios · Mansedumbre II')
  expect(html).not.toContain('registerSW')
  expect(html).not.toContain('rel="manifest"')
})

test('la app sigue con noindex', async ({ page }) => {
  await page.goto('/')
  expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe('noindex, nofollow')
})

test('abre sin internet tras una visita', async ({ page, context }) => {
  await page.goto('/anuncios/publico')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload() // la página queda controlada por su Service Worker
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Anuncios', level: 1 })).toBeVisible()
  await expect(page.getByText(/Ábrela una vez con internet|No se pudieron cargar los anuncios/)).toBeVisible()
})
