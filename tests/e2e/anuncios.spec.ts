// Flujo completo de P4 contra el build, sin red: crear, ver en Inicio, duplicar, recargar y eliminar.
import { devices, expect, test, type Page } from '@playwright/test'

const isoInDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Carga una vez con red, deja la página controlada por el Service Worker y corta la red. */
async function goOffline(page: Page, context: import('@playwright/test').BrowserContext) {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
}

test('crear, duplicar, recargar y eliminar anuncios sin red (RF-01…RF-10, RNF-01, RNF-03)', async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const external: string[] = []
  page.on('request', (r) => {
    if (new URL(r.url()).origin !== origin) external.push(r.url())
  })
  await goOffline(page, context)

  // 1. Nuevo anuncio → Culto → título, fecha y hora → Guardar.
  const t0 = Date.now()
  await page.getByRole('link', { name: 'Nuevo anuncio' }).first().click()
  await page.locator('[data-type-card="culto"]').click()
  await page.locator('#campo-titulo').fill('Culto joven')
  await page.locator('#campo-fecha').fill(isoInDays(5))
  await page.locator('#campo-hora').fill('19:00')
  await expect(page.locator('[data-preview] [data-role="title"]')).toHaveText('Culto joven')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page).toHaveURL(/\/anuncios\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible()
  console.log(`RNF-03 (referencia): crear un culto tomó ${((Date.now() - t0) / 1000).toFixed(1)} s con Playwright`)

  // 2. En Inicio aparece.
  await page.getByRole('link', { name: 'Inicio' }).click()
  await expect(page.locator('[data-announcement-row]')).toHaveCount(1)
  await expect(page.locator('[data-announcement-row] [data-title]')).toHaveText('Culto joven')

  // 3. Duplicar: abre la copia con el foco en la fecha; se cambia la fecha y se guarda.
  await page.getByRole('button', { name: 'Duplicar «Culto joven»' }).click()
  await expect(page.locator('#campo-fecha')).toBeFocused()
  await page.locator('#campo-fecha').fill(isoInDays(12))
  await page.keyboard.press('Control+s')
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible()

  // 4. Tras recargar, los dos siguen ahí.
  await page.goto('/anuncios')
  await expect(page.locator('[data-announcement-row]')).toHaveCount(2)

  // 5. Eliminar uno.
  await page.getByRole('button', { name: 'Eliminar «Culto joven»' }).first().click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('[data-announcement-row]')).toHaveCount(1)

  expect(external).toEqual([])
})

test.describe('en el celular', () => {
  // Pantalla, toque y user agent del Pixel 7 (defaultBrowserType no se puede cambiar dentro de un grupo).
  const { defaultBrowserType: _browser, ...pixel7 } = devices['Pixel 7']
  test.use(pixel7)

  test('editor: vista previa arriba y plegable, sin scroll horizontal', async ({ page }) => {
    await page.goto('/anuncios/nuevo/culto')
    await page.locator('#campo-titulo').fill('Culto joven')
    const preview = page.locator('#vista-previa')
    const form = page.getByRole('region', { name: 'Datos del anuncio' })
    await expect(preview).toBeVisible()
    expect((await preview.boundingBox())!.y).toBeLessThan((await form.boundingBox())!.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Ocultar vista previa' }).click()
    await expect(preview).toBeHidden()
    await page.getByRole('button', { name: 'Mostrar vista previa' }).click()
    await expect(preview).toBeVisible()
  })

  test('lista y paso 1 sin scroll horizontal', async ({ page }) => {
    for (const path of ['/', '/anuncios', '/anuncios/nuevo']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true)
    }
  })
})
