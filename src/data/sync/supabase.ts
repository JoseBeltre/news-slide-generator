// Cliente de Supabase (§8.5), solo si el build trae las variables públicas. Se importa de forma diferida:
// sin nube configurada, la app no descarga ni ejecuta nada de Supabase.
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseConfig {
  url: string
  key: string
}

/** `null` si falta alguna variable: la sincronización queda desactivada y la app funciona como siempre. */
export function supabaseConfig(env: Record<string, string | undefined> = import.meta.env): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  return url && key ? { url, key } : null
}

let client: Promise<SupabaseClient> | undefined

export function getClient(config: SupabaseConfig | null = supabaseConfig()): Promise<SupabaseClient | null> {
  if (!config) return Promise.resolve(null)
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(config.url, config.key, {
      // La sesión vive en este navegador y se renueva sola: el código se pide una vez por equipo.
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    }),
  )
  return client
}
