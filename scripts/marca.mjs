// Iconos e imagen para compartir de la app, desde public/icon.svg (sin fondo: escritorio y pestaña),
// public/icon-maskable.svg (con fondo: Android e iPhone) y scripts/og-template.html.
// Uso: pnpm marca. Los PNG y el favicon.ico se guardan en public/ y se suben al repositorio.
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const read = (path) => readFileSync(path, 'utf8')
const woff2 = (path) => `url(data:font/woff2;base64,${readFileSync(path).toString('base64')}) format('woff2')`

const ICONS = [
  { svg: 'public/icon.svg', out: 'public/pwa-64x64.png', size: 64, transparent: true },
  { svg: 'public/icon.svg', out: 'public/pwa-192x192.png', size: 192, transparent: true },
  { svg: 'public/icon.svg', out: 'public/pwa-512x512.png', size: 512, transparent: true },
  { svg: 'public/icon.svg', out: 'public/favicon-32x32.png', size: 32, transparent: true },
  { svg: 'public/icon-maskable.svg', out: 'public/maskable-icon-512x512.png', size: 512 },
  { svg: 'public/icon-maskable.svg', out: 'public/apple-touch-icon-180x180.png', size: 180 },
]

/** Un .ico con un único PNG dentro (válido desde Windows Vista y en todos los navegadores). */
function icoFromPng(png, size) {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(size % 256, 6)
  header.writeUInt8(size % 256, 7)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(22, 18)
  return Buffer.concat([header, png])
}

const browser = await chromium.launch()
for (const icon of ICONS) {
  const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } })
  const svg = read(icon.svg).replace('<svg ', `<svg width="${icon.size}" height="${icon.size}" `)
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`)
  await page.screenshot({ path: icon.out, omitBackground: icon.transparent ?? false })
  await page.close()
  console.log(icon.out)
}
writeFileSync('public/favicon.ico', icoFromPng(readFileSync('public/favicon-32x32.png'), 32))
console.log('public/favicon.ico')

const fonts = `
  @font-face { font-family: 'Instrument Serif'; src: ${woff2('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2')}; }
  @font-face { font-family: 'Inter Variable'; font-weight: 100 900; src: ${woff2('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}; }`
const og = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await og.setContent(read('scripts/og-template.html').replace('/* @font-face: lo añade marca.mjs */', fonts))
await og.evaluate(() => document.fonts.ready)
await og.screenshot({ path: 'public/og.png' })
console.log('public/og.png')
await browser.close()
