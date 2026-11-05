// Carga de la página pública (P9, RF-73): un `fetch` a `public_notices`, sin la librería de Supabase.
// La última respuesta buena queda en este celular; sin red o con error se muestra esa, con su fecha.
// Con la sesión del equipo (spec §6.5) se pide antes `team_notices`, guardada aparte; si el servidor la
// rechaza (no es del equipo, sesión inválida), la vista pública de siempre.
import { z } from 'zod'
import { fetchWithTimeout, type SupabaseConfig } from '../data/sync/supabase'
import type { LoadState, PublicNoticesData } from './types'

export const CACHE_KEY = 'anuncios-publicos:v1'
export const TEAM_CACHE_KEY = 'anuncios-equipo:v1'
const TIMEOUT_MS = 15_000

const dataSchema = z.object({
  enabled: z.boolean().optional(),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  settings: z.object({
    timeFormat: z.enum(['12h', '24h']).optional(),
    currency: z.string().optional(),
    dateStyle: z.string().optional(),
  }),
  notices: z.array(
    z.object({
      id: z.string(),
      typeId: z.string(),
      values: z.record(z.string(), z.unknown()),
      eventDate: z.string().nullable(),
      updatedAt: z.string(),
    }),
  ),
})
const cacheSchema = z.object({ data: dataSchema, savedAt: z.string() })
type Data = PublicNoticesData & { enabled?: boolean }

export interface LoadDeps {
  config: SupabaseConfig | null
  fetch: typeof fetch
  storage: Storage | null
  now: () => Date
  /** Token de la sesión del equipo (`teamToken`); sin él, solo la vista pública. */
  token?: string | null
}

export async function loadNotices(deps: LoadDeps): Promise<LoadState> {
  if (!deps.config) return fromCache(deps.storage, CACHE_KEY, 'error')
  if (deps.token) {
    const team = await request(deps, 'team_notices', { Authorization: `Bearer ${deps.token}` })
    if (team === 'offline') {
      const cached = fromCache(deps.storage, TEAM_CACHE_KEY, 'offline')
      return 'data' in cached ? { ...cached, team: true } : fromCache(deps.storage, CACHE_KEY, 'offline')
    }
    if (team) return { ...save(deps, TEAM_CACHE_KEY, team), team: true }
  }
  const data = await request(deps, 'public_notices', {})
  if (data === 'offline') return fromCache(deps.storage, CACHE_KEY, 'offline')
  if (!data) return fromCache(deps.storage, CACHE_KEY, 'error')
  if (data.enabled === false) {
    try {
      deps.storage?.removeItem(CACHE_KEY)
    } catch {
      // Almacenamiento bloqueado: no había nada que borrar.
    }
    return { kind: 'disabled' }
  }
  return save(deps, CACHE_KEY, data)
}

/** La respuesta válida, `null` si el servidor respondió mal o con otra forma, `'offline'` sin red. */
async function request(deps: LoadDeps, fn: string, headers: Record<string, string>): Promise<Data | null | 'offline'> {
  let response: Response
  try {
    response = await fetchWithTimeout(TIMEOUT_MS, deps.fetch)(`${deps.config!.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: deps.config!.key, 'Content-Type': 'application/json', ...headers },
      body: '{}',
    })
  } catch {
    return 'offline'
  }
  if (!response.ok) return null
  try {
    const parsed = dataSchema.safeParse(await response.json())
    return parsed.success ? (parsed.data as Data) : null
  } catch {
    return null
  }
}

function save(deps: LoadDeps, key: string, data: Data): Extract<LoadState, { kind: 'fresh' }> {
  const savedAt = deps.now().toISOString()
  try {
    deps.storage?.setItem(key, JSON.stringify({ data, savedAt }))
  } catch {
    // Sin espacio o bloqueado: la página se ve igual, solo no queda guardada.
  }
  return { kind: 'fresh', data, savedAt }
}

function fromCache(storage: Storage | null, key: string, otherwise: 'offline' | 'error'): LoadState {
  try {
    const raw = storage?.getItem(key)
    const parsed = raw ? cacheSchema.safeParse(JSON.parse(raw)) : null
    if (parsed?.success) return { kind: 'cached', ...parsed.data }
  } catch {
    // Caché ilegible o almacenamiento bloqueado: como si no hubiera.
  }
  return { kind: otherwise }
}
