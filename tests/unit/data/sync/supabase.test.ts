// Cliente de Supabase (§8.5): sin variables no hay nube; los errores de la API se traducen a los tipos
// del sincronizador; Entrar y Equipo dan mensajes claros en español.
import { describe, expect, it } from 'vitest'
import { createAuth, normalizeEmail } from '../../../../src/data/sync/auth'
import { supabaseConfig } from '../../../../src/data/sync/supabase'
import { classify, createSupabaseRemote } from '../../../../src/data/sync/supabaseRemote'

type Result = { data?: unknown; error: { message: string; code?: string; statusCode?: string } | null; status?: number }

/** Cliente falso: cada llamada devuelve el resultado programado y registra lo pedido. */
function fakeClient(results: Partial<Record<'rpc' | 'select' | 'insert' | 'delete' | 'upload' | 'download' | 'otp' | 'verify', Result>> = {}) {
  const calls: unknown[][] = []
  const ok = { data: null, error: null, status: 200 }
  const builder = (kind: 'select' | 'insert' | 'delete', args: unknown[]) => {
    calls.push([kind, ...args])
    const b: Record<string, unknown> = {}
    for (const m of ['gt', 'order', 'limit', 'eq']) b[m] = (...a: unknown[]) => (calls.push([m, ...a]), b)
    b.then = (resolve: (r: Result) => void) => resolve(results[kind] ?? ok)
    return b
  }
  const client = {
    rpc: async (...a: unknown[]) => (calls.push(['rpc', ...a]), results.rpc ?? ok),
    from: (table: string) => ({
      select: (...a: unknown[]) => builder('select', [table, ...a]),
      insert: (...a: unknown[]) => builder('insert', [table, ...a]),
      delete: () => builder('delete', [table]),
    }),
    storage: {
      from: () => ({
        upload: async (...a: unknown[]) => (calls.push(['upload', ...a]), results.upload ?? ok),
        download: async (...a: unknown[]) => (calls.push(['download', ...a]), results.download ?? { data: new Blob(['x']), error: null }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithOtp: async (...a: unknown[]) => (calls.push(['otp', ...a]), results.otp ?? ok),
      verifyOtp: async (...a: unknown[]) => (calls.push(['verify', ...a]), results.verify ?? ok),
      signOut: async () => ok,
    },
  }
  return { client: client as never, calls }
}

describe('supabaseConfig', () => {
  it('sin variables no hay nube', () => {
    expect(supabaseConfig({})).toBeNull()
    expect(supabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull()
    expect(supabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' })).toEqual({ url: 'https://x.supabase.co', key: 'k' })
  })
})

describe('classify', () => {
  it.each([
    [{ message: 'TypeError: Failed to fetch' }, 0, 'offline'],
    [{ message: 'JWT expired', code: 'PGRST303' }, 401, 'auth'],
    [{ message: 'new row violates row-level security policy', code: '42501' }, 403, 'auth'],
    [{ message: 'Service Unavailable' }, 503, 'server'],
    [{ message: 'paused' }, 540, 'server'],
    [{ message: 'tabla no sincronizable', code: '22023' }, 400, 'rejected'],
  ] as const)('%o (%i) → %s', (error, status, kind) => {
    expect(classify(error, status).kind).toBe(kind)
  })
})

describe('createSupabaseRemote', () => {
  it('push llama a sync_push y traduce el error', async () => {
    const { client, calls } = fakeClient({ rpc: { error: { message: 'Service Unavailable' }, status: 503 } })
    const remote = createSupabaseRemote(client)
    await expect(remote.push('announcements', [])).rejects.toMatchObject({ kind: 'server' })
    expect(calls[0]).toEqual(['rpc', 'sync_push', { p_table: 'announcements', p_rows: [] }])
  })

  it('pull pide desde el cursor, en orden de llegada y con límite', async () => {
    const { client, calls } = fakeClient({ select: { data: [{ id: 'a' }], error: null, status: 200 } })
    expect(await createSupabaseRemote(client).pull('themes', '2026-11-03T12:00:00.000Z', 500)).toEqual([{ id: 'a' }])
    expect(calls).toContainEqual(['gt', 'synced_at', '2026-11-03T12:00:00.000Z'])
    expect(calls).toContainEqual(['order', 'synced_at', { ascending: true }])
    expect(calls).toContainEqual(['limit', 500])
  })

  it('subir un archivo que ya existe cuenta como éxito', async () => {
    const { client } = fakeClient({ upload: { error: { message: 'The resource already exists', statusCode: '409' } } })
    await expect(createSupabaseRemote(client).uploadFile('images/h.webp', new Blob(['x']))).resolves.toBeUndefined()
  })
})

describe('createAuth', () => {
  it('normaliza correos', () => {
    expect(normalizeEmail('  Ana@Iglesia.DO ')).toBe('ana@iglesia.do')
  })

  it('addEditor guarda en minúsculas y rechaza correos inválidos o repetidos', async () => {
    const { client, calls } = fakeClient()
    const auth = createAuth(client)
    await auth.addEditor(' Ana@X.com ')
    expect(calls).toContainEqual(['insert', 'editors', { email: 'ana@x.com' }])
    await expect(auth.addEditor('no-es-correo')).rejects.toThrow('Escribe un correo válido.')
    const dup = createAuth(fakeClient({ insert: { error: { message: 'duplicate', code: '23505' }, status: 409 } }).client)
    await expect(dup.addEditor('ana@x.com')).rejects.toThrow('Ese correo ya está en el equipo.')
  })

  it('verifyCode con error da un mensaje claro', async () => {
    const auth = createAuth(fakeClient({ verify: { error: { message: 'Token has expired or is invalid' } } }).client)
    await expect(auth.verifyCode('ana@x.com', '123456')).rejects.toThrow('El código no es correcto o ya caducó.')
  })

  it('sendCode pide el código creando el usuario si hace falta', async () => {
    const { client, calls } = fakeClient()
    await createAuth(client).sendCode(' Ana@X.com')
    expect(calls).toContainEqual(['otp', { email: 'ana@x.com', options: { shouldCreateUser: true } }])
  })
})
