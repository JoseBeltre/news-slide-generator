// Reglas de arquitectura de la interfaz (plan P4, regla estricta del responsable):
// solo Tailwind, archivos pequeños con una responsabilidad y dependencias en una sola dirección.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const UI_DIRS = ['src/app', 'src/ui', 'src/features']
const STYLESHEET = 'src/ui/styles.css'

function walk(dir: string): string[] {
  const abs = join(ROOT, dir)
  if (!existsSync(abs)) return []
  return readdirSync(abs).flatMap((name) => {
    const path = join(dir, name)
    return statSync(join(ROOT, path)).isDirectory() ? walk(path) : [path.split(sep).join('/')]
  })
}

const files = UI_DIRS.flatMap(walk)
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')
const lines = (path: string) => read(path).trimEnd().split('\n').length
const importsOf = (path: string) =>
  [...read(path).matchAll(/from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1] ?? m[2]!)
/** Ruta de un import relativo, desde la raíz del repo. */
const resolveImport = (from: string, spec: string) =>
  spec.startsWith('.') ? relative(ROOT, join(ROOT, from, '..', spec)).split(sep).join('/') : spec

describe('arquitectura de la interfaz', () => {
  it('existen las carpetas de la interfaz', () => {
    expect(files).toContain(STYLESHEET)
  })

  it('ningún componente tiene <style>, style="…" escrito a mano ni @apply', () => {
    const offenders = files.filter((f) => {
      const src = read(f)
      return (f.endsWith('.vue') && (/<style[\s>]/.test(src) || /(?<![:\w-])style="/.test(src))) || src.includes('@apply')
    })
    expect(offenders).toEqual([])
  })

  it(`el único CSS de la interfaz es ${STYLESHEET}`, () => {
    expect(files.filter((f) => f.endsWith('.css'))).toEqual([STYLESHEET])
  })

  it('styles.css solo declara tokens: ninguna regla para elementos o clases', () => {
    const css = read(STYLESHEET).replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{};]+)\{/g)].map((m) => m[1]!.trim())
    // Los @keyframes del movimiento viven en el @theme (tokens de animación): su nombre y sus pasos son válidos.
    const allowed = /^(@theme|@layer theme|:root|:root\[data-theme="(light|dark)"\]|@keyframes [\w-]+|from|to|\d+%(,\s*\d+%)*)$/
    expect(selectors.filter((s) => !allowed.test(s))).toEqual([])
  })

  it('todo <button> de la interfaz muestra la mano (cursor-pointer): el preflight de Tailwind la quita', () => {
    const offenders = files.filter((f) => f.endsWith('.vue') && /<button[\s>]/.test(read(f)) && !read(f).includes('cursor-pointer'))
    expect(offenders).toEqual([])
  })

  it('los colores del tema oscuro se declaran una sola vez (light-dark), sin bloque @media aparte', () => {
    const css = read(STYLESHEET)
    expect(css).not.toContain('prefers-color-scheme')
    expect(css).toMatch(/--color-background:\s*light-dark\(/)
  })

  it('páginas ≤ 80 líneas, componentes ≤ 150, módulos .ts ≤ 200', () => {
    const limit = (f: string) => (f.endsWith('Page.vue') ? 80 : f.endsWith('.vue') ? 150 : f.endsWith('.ts') ? 200 : Infinity)
    expect(files.filter((f) => lines(f) > limit(f)).map((f) => `${f}: ${lines(f)} > ${limit(f)}`)).toEqual([])
  })

  it('todo componente que carga el router se llama *Page.vue', () => {
    const routed = importsOf('src/app/router.ts').filter((s) => s.endsWith('.vue'))
    expect(routed.length).toBeGreaterThan(0)
    expect(routed.filter((s) => !s.endsWith('Page.vue'))).toEqual([])
  })

  it('src/ui no depende de app, features, datos ni slides', () => {
    const bad = files
      .filter((f) => f.startsWith('src/ui/'))
      .flatMap((f) => importsOf(f).map((s) => `${f} → ${resolveImport(f, s)}`))
      .filter((pair) => / → src\/(app|features|data|slides)\//.test(pair))
    expect(bad).toEqual([])
  })

  it('una funcionalidad no importa de otra, salvo de su carpeta shared/', () => {
    const featureOf = (path: string) => /^src\/features\/([^/]+)\//.exec(path)?.[1]
    const bad = files
      .filter((f) => featureOf(f))
      .flatMap((f) => importsOf(f).map((s) => [f, resolveImport(f, s)] as const))
      .filter(([f, target]) => {
        const other = featureOf(target)
        return other && other !== featureOf(f) && !/^src\/features\/[^/]+\/shared\//.test(target)
      })
      .map(([f, target]) => `${f} → ${target}`)
    expect(bad).toEqual([])
  })
})
