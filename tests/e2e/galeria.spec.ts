// Capturas de regresión de las slides (§10.13): una por estilo y caso (cumpleaños incluidos), a 1920×1080, desde la galería.
// Las capturas base son locales (no se suben): la primera corrida las crea y las siguientes comparan.
import { expect, test } from '@playwright/test'

const STYLES = ['himnario', 'almanaque', 'cartel']
const CASES = ['culto-lleno-neutro', 'salida-llena-vino', 'aviso-sin-fecha-pizarra', 'visual-neutro', 'portada-neutro', 'cierre-neutro', 'cumple-uno-foto-versiculo-neutro', 'cumple-grupo-8-neutro', 'cumple-grupo-6-cielo']
const IDS = [...STYLES.flatMap((s) => CASES.map((c) => `estilo-${s}-${c}`)), 'imagen-flyer-vertical']

for (const id of IDS) {
  test(id, async ({ page }) => {
    await page.goto(`/galeria.html?only=${id}`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => document.querySelector('[data-status]') && (document.querySelectorAll('[data-fit]').length > 0 || document.querySelector('[data-image]')))
    await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.style.visibility !== 'hidden'))
    await expect(page.locator('[data-status]')).toHaveAttribute('data-status', 'ok')
    expect(await page.evaluate(() => (window as unknown as { auditSlide: () => string[] }).auditSlide())).toEqual([])
    await expect(page).toHaveScreenshot(`${id}.png`)
  })
}
