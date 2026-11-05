// Dependencias declaradas: lo que el build importa tiene que estar en package.json. En local pnpm puede
// resolverlo por casualidad (hoisting), pero en CI, con pnpm estricto, el build falla.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
const declared = { ...pkg.dependencies, ...pkg.devDependencies }

describe('dependencias', () => {
  it('virtual:pwa-register importa workbox-window: tiene que estar declarado', () => {
    expect(read('src/main.ts')).toContain('virtual:pwa-register')
    expect(declared).toHaveProperty('workbox-window')
  })
})
