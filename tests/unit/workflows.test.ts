// Despliegue con la nube (§8.4, §11 paso 8): el build publicado lleva las variables públicas de
// Supabase; las E2E corren sin ellas; un workflow mantiene despierto el proyecto gratuito.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const file = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

describe('keep-alive.yml', () => {
  const yml = file('.github/workflows/keep-alive.yml')

  it('corre cada 3 días y a mano', () => {
    expect(yml).toMatch(/cron: '0 12 \*\/3 \* \*'/)
    expect(yml).toContain('workflow_dispatch:')
  })

  it('llama a ping() con la clave pública guardada como variable', () => {
    expect(yml).toContain('/rest/v1/rpc/ping')
    expect(yml).toContain('${{ vars.VITE_SUPABASE_URL || secrets.VITE_SUPABASE_URL }}')
    expect(yml).toContain('${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY || secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}')
  })
})

describe('deploy.yml', () => {
  const yml = file('.github/workflows/deploy.yml')

  it('el build que se sube lleva las dos variables, después de las E2E', () => {
    const e2e = yml.indexOf('pnpm test:e2e')
    const cloudBuild = yml.indexOf('VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL || secrets.VITE_SUPABASE_URL }}')
    expect(cloudBuild).toBeGreaterThan(e2e)
    expect(yml).toContain('VITE_SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY || secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}')
    expect(cloudBuild).toBeLessThan(yml.indexOf('FTP-Deploy-Action'))
  })
})

describe('.env.example', () => {
  it('nombra las variables sin valores', () => {
    const env = file('.env.example')
    expect(env).toMatch(/^VITE_SUPABASE_URL=$/m)
    expect(env).toMatch(/^VITE_SUPABASE_PUBLISHABLE_KEY=$/m)
  })
})
