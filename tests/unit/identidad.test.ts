// Identidad del sitio: buscadores fuera (aún no hay nada público que buscar) y buena vista previa
// al compartir el enlace con el equipo.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const file = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const html = file('index.html')
const meta = (attr: 'name' | 'property', key: string) =>
  new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`).exec(html)?.[1]

describe('index.html', () => {
  it('no se indexa en buscadores', () => {
    expect(meta('name', 'robots')).toBe('noindex, nofollow')
    expect(file('public/robots.txt')).toMatch(/User-agent: \*\s+Disallow: \//)
  })

  it('describe la app y pinta la barra del navegador con los colores de la interfaz', () => {
    expect(meta('name', 'description')).toMatch(/Mansedumbre II/)
    expect(html).toContain('<meta name="theme-color" content="#f3f0d6" media="(prefers-color-scheme: light)"')
    expect(html).toContain('<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)"')
    expect(meta('name', 'apple-mobile-web-app-title')).toBe('Anuncios')
  })

  it('iconos: SVG sin fondo en la pestaña, .ico de respaldo y el de Apple con fondo', () => {
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="32x32"')
    expect(html).toContain('<link rel="icon" href="/icon.svg" type="image/svg+xml"')
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png"')
  })

  it('vista previa al compartir: título, descripción e imagen con dirección completa', () => {
    expect(meta('property', 'og:title')).toBe('Anuncios del Sábado · Mansedumbre II')
    expect(meta('property', 'og:description')).toBe(meta('name', 'description'))
    expect(meta('property', 'og:image')).toBe('https://anunciosm2.jose-web.com/og.png')
    expect(meta('property', 'og:image:width')).toBe('1200')
    expect(meta('property', 'og:image:height')).toBe('630')
    expect(meta('property', 'og:locale')).toBe('es_DO')
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
  })
})
