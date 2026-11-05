// Vista del equipo (P9, spec §6.5): la sesión que la app guarda en este mismo dominio (supabase-js, clave
// `sb-<ref>-auth-token`). Aquí solo se lee: sin sesión, ilegible o vencida → null y la página es la pública.
// No se renueva: al abrir la app se renueva sola. Así la página no carga la librería de Supabase.

export function teamToken(storage: Storage | null, supabaseUrl: string, nowMs: number): string | null {
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0]
    const raw = storage?.getItem(`sb-${ref}-auth-token`)
    if (!raw) return null
    const session: unknown = JSON.parse(raw)
    if (!session || typeof session !== 'object') return null
    const { access_token: token, expires_at: expiresAt } = session as { access_token?: unknown; expires_at?: unknown }
    if (typeof token !== 'string' || typeof expiresAt !== 'number') return null
    return expiresAt * 1000 > nowMs ? token : null
  } catch {
    return null
  }
}
