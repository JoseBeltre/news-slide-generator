// Vista del equipo (P9, spec §6.5): la página lee la sesión que la app guarda en este dominio. Sin sesión,
// ilegible o vencida, no hay token y se usa la vista pública.
import { describe, expect, it } from 'vitest'
import { teamToken } from '../../../src/public-notices/session'

const URL_SB = 'https://abc.supabase.co'
const KEY = 'sb-abc-auth-token'
const NOW = Date.parse('2026-11-05T15:00:00Z')
const store = (value?: string): Storage => ({ getItem: (k: string) => (k === KEY ? value ?? null : null) }) as Storage

describe('teamToken', () => {
  it('sin sesión → null', () => {
    expect(teamToken(store(), URL_SB, NOW)).toBeNull()
    expect(teamToken(null, URL_SB, NOW)).toBeNull()
  })

  it('ilegible → null', () => {
    expect(teamToken(store('{no es json'), URL_SB, NOW)).toBeNull()
    expect(teamToken(store(JSON.stringify({ access_token: 1 })), URL_SB, NOW)).toBeNull()
  })

  it('vencida → null', () => {
    expect(teamToken(store(JSON.stringify({ access_token: 'tok', expires_at: NOW / 1000 })), URL_SB, NOW)).toBeNull()
  })

  it('vigente → el token', () => {
    expect(teamToken(store(JSON.stringify({ access_token: 'tok', expires_at: NOW / 1000 + 600 })), URL_SB, NOW)).toBe('tok')
  })

  it('un storage que lanza → null', () => {
    const broken = { getItem: () => { throw new Error('bloqueado') } } as unknown as Storage
    expect(teamToken(broken, URL_SB, NOW)).toBeNull()
  })
})
