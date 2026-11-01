// Capturas de la galería a 1920×1080 con la auditoría de §5 de cada slide.
// Uso: node scripts/capturar-galeria.mjs <prefijo-de-id> <carpeta-de-salida> [url-base]
// Requiere `pnpm dev --port 5174` corriendo. Imprime una línea por slide: id, estado y violaciones.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const [prefix = 'dir-', outDir = 'docs/slides-direcciones', base = 'http://localhost:5174'] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(`${base}/galeria.html`)
const ids = await page.$$eval('figcaption a', (links) => links.map((a) => new URL(a.href).searchParams.get('only')))

let failures = 0
for (const id of ids.filter((i) => i?.startsWith(prefix))) {
  await page.goto(`${base}/galeria.html?only=${id}`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => document.querySelector('[data-status]') && document.querySelectorAll('[data-fit]').length > 0)
  // Logos e imágenes cargados antes de medir y capturar.
  await page.waitForFunction(() => [...document.images].every((img) => img.complete))
  await page.waitForTimeout(150)
  const status = await page.getAttribute('[data-status]', 'data-status')
  const violations = await page.evaluate(() => window.auditSlide())
  if (status !== 'ok' || violations.length) failures++
  await page.screenshot({ path: join(outDir, `${id}.png`) })
  console.log(`${id}\t${status}\t${violations.join(' | ') || '—'}`)
}
await browser.close()
process.exitCode = failures ? 1 : 0
