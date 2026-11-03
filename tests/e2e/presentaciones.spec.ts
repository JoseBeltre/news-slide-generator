// Flujo de P5 contra el build, sin red: Inicio → crear la presentación del sábado con los anuncios
// sugeridos → ordenar → miniaturas → "Preparar sin internet" → lista.
import { expect, test, type Page } from '@playwright/test'
import { goOffline, nextSaturdayIso } from './helpers'

async function newCulto(page: Page, titulo: string, fecha: string) {
  await page.goto('/anuncios/nuevo/culto')
  await page.locator('#campo-titulo').fill(titulo)
  await page.locator('#campo-fecha').fill(fecha)
  await page.locator('#campo-hora').fill('19:00')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible()
}

test('crear, ordenar y preparar la presentación del sábado sin red (RF-50…RF-55, §10.1)', async ({ page, context }) => {
  await goOffline(page, context)
  const saturday = nextSaturdayIso()
  await newCulto(page, 'Vigilia', saturday)
  await newCulto(page, 'Ayuno', saturday)

  await page.getByRole('link', { name: 'Inicio' }).click()
  await page.getByRole('button', { name: 'Crear la presentación del sábado' }).click()
  await expect(page).toHaveURL(/\/presentaciones\/[0-9a-f-]{36}$/)
  const rows = page.getByRole('list', { name: 'Orden de los anuncios' }).locator('li')
  await expect(rows).toHaveCount(2)

  const first = await rows.first().textContent()
  await rows.first().getByRole('button', { name: /^Bajar/ }).click()
  await expect(rows.nth(1)).toContainText(first!.includes('Vigilia') ? 'Vigilia' : 'Ayuno')
  await expect(page.locator('[data-thumb]')).toHaveCount(4)
  await expect(page.getByText('4 slides')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Preparar sin internet' }).click()
  await expect(page.getByText('✓ Lista para usar sin internet')).toBeVisible({ timeout: 10_000 })

  await page.getByRole('link', { name: 'Inicio' }).click()
  await expect(page.getByText('✓ Lista para usar sin internet')).toBeVisible({ timeout: 10_000 })
})
