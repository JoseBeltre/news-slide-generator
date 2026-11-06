// Exportar e importar (RF-112) contra el build y sin red: exportar un anuncio, volver a importarlo en el
// mismo equipo y obtener la copia "(2)".
import { expect, test } from '@playwright/test'
import { goOffline, isoInDays, rowAction } from './helpers'

test('exportar un anuncio y reimportarlo como copia sin red (RF-112)', async ({ page, context }, testInfo) => {
  await goOffline(page, context)

  // 1. Crear "Culto".
  await page.getByRole('link', { name: 'Nuevo anuncio' }).first().click()
  await page.locator('[data-type-card="culto"]').click()
  await page.locator('#campo-titulo').fill('Culto')
  await page.locator('#campo-fecha').fill(isoInDays(5))
  await page.locator('#campo-hora').fill('19:00')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible()

  // 2. Exportarlo desde la lista.
  await page.getByRole('link', { name: 'Anuncios', exact: true }).click()
  const downloading = page.waitForEvent('download')
  await rowAction(page, 'Culto', 'Exportar')
  const download = await downloading
  expect(download.suggestedFilename()).toBe('anuncio-culto.zip')
  const file = testInfo.outputPath('anuncio-culto.zip')
  await download.saveAs(file)

  // 3. Importarlo: ya está en este equipo → copia por defecto.
  await page.locator('input[type="file"][accept*=".zip"]').setInputFiles(file)
  await expect(page).toHaveURL(/\/importar$/)
  await expect(page.getByText('Ya está en este equipo')).toBeVisible()
  await page.getByRole('button', { name: 'Importar', exact: true }).click()
  await expect(page.getByText('Se importó 1 anuncio')).toBeVisible()

  // 4. En Anuncios están el original y la copia.
  await page.getByRole('link', { name: 'Anuncios', exact: true }).click()
  await expect(page.locator('[data-announcement-row]')).toHaveCount(2)
  await expect(page.locator('[data-announcement-row] [data-title]').filter({ hasText: /^Culto \(2\)$/ })).toHaveCount(1)
})
