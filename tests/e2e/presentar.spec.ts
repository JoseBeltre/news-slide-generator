// Flujo de P6 contra el build, sin red: presentador + ventana pública sincronizados por
// BroadcastChannel, teclas desde las dos, negro, reabrir en la misma slide y una sola ventana.
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

/** Ms entre la tecla en `from` y el cambio de slide en `to` (relojes Date.now de la misma máquina). */
async function switchDelay(from: Page, to: Page, key: string, expected: string) {
  await to.evaluate((want) => {
    const stage = document.querySelector('[data-stage]')!
    ;(window as unknown as { seen?: Promise<number> }).seen = new Promise((resolve) => {
      new MutationObserver(() => stage.getAttribute('data-index') === want && resolve(Date.now())).observe(stage, { attributes: true })
    })
  }, expected)
  const sentAt = await from.evaluate((k) => {
    const t = Date.now()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))
    return t
  }, key)
  const seenAt = await to.evaluate(() => (window as unknown as { seen: Promise<number> }).seen)
  return seenAt - sentAt
}

test('presentar con dos ventanas sin red (RF-60…RF-68, RNF-04, §10.1–3)', async ({ page, context }) => {
  await goOffline(page, context)
  const saturday = nextSaturdayIso()
  await newCulto(page, 'Vigilia', saturday)
  await newCulto(page, 'Ayuno', saturday)
  await page.getByRole('link', { name: 'Inicio' }).click()
  await page.getByRole('button', { name: 'Crear la presentación del sábado' }).click()
  await expect(page.locator('[data-thumb]')).toHaveCount(4)
  await page.getByRole('button', { name: 'Presentar' }).click()
  await expect(page.getByText('1 de 4')).toBeVisible()

  // Abrir la pantalla pública: ninguna barra ni botón tras el primer clic.
  const [publica] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Abrir pantalla pública' }).click()])
  await publica.locator('[data-fullscreen-hint]').click()
  await expect(publica.locator('[data-stage]')).toHaveAttribute('data-index', '0')
  await expect(publica.locator('[data-stage]')).not.toHaveAttribute('data-black', /.*/)
  expect(await publica.locator('button:visible').count()).toBe(0)

  // Desde el presentador: → (medido, RNF-04) y B.
  const delay = await switchDelay(page, publica, 'ArrowRight', '1')
  console.log(`RNF-04: cambio de slide entre ventanas en ${delay} ms`)
  expect(delay).toBeLessThan(100)
  await expect(page.getByText('2 de 4')).toBeVisible()
  await page.keyboard.press('b')
  await expect(publica.locator('[data-stage]')).toHaveAttribute('data-black', 'true')
  await page.keyboard.press('b')

  // Desde la pública: → avanza las dos.
  await publica.keyboard.press('ArrowRight')
  await expect(publica.locator('[data-stage]')).toHaveAttribute('data-index', '2')
  await expect(page.getByText('3 de 4')).toBeVisible()

  // Cerrar la pública por error y reabrirla: vuelve a la misma slide.
  await publica.close()
  await expect(page.getByRole('button', { name: 'Reabrir pantalla pública' })).toBeVisible({ timeout: 5000 })
  const [otra] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Reabrir pantalla pública' }).click()])
  await expect(otra.locator('[data-stage]')).toHaveAttribute('data-index', '2')

  // Esc en el presentador: cierra la pública y vuelve a la presentación.
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/presentaciones\/[0-9a-f-]{36}$/)

  // Una sola ventana: → y Esc.
  await page.getByRole('button', { name: 'Una sola ventana' }).click()
  await page.locator('[data-fullscreen-hint]').click()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-index', '1')
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/presentaciones\/[0-9a-f-]{36}$/)
})
