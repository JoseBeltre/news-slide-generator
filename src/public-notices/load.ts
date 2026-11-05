// Carga de la página pública (P9, RF-73): un `fetch` a `public_notices`, sin la librería de Supabase.
// La última respuesta buena queda en este celular; sin red o con error se muestra esa, con su fecha.
import { z } from 'zod'
import { fetchWithTimeout, type SupabaseConfig } from '../data/sync/supabase'
import type { LoadState, PublicNoticesData } from './types'

export const CACHE_KEY = 'anuncios-publicos:v1'
const TIMEOUT_MS = 15_000

const dataSchema = z.object({
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

export interface LoadDeps {
  config: SupabaseConfig | null
  fetch: typeof fetch
  storage: Storage | null
  now: () => Date
}

export async function loadNotices(deps: LoadDeps): Promise<LoadState> {
  if (!deps.config) return fromCache(deps.storage, 'error')
  let response: Response
  try {
    response = await fetchWithTimeout(TIMEOUT_MS, deps.fetch)(`${deps.config.url}/rest/v1/rpc/public_notices`, {
      method: 'POST',
      headers: { apikey: deps.config.key, 'Content-Type': 'application/json' },
      body: '{}',
    })
  } catch {
    return fromCache(deps.storage, 'offline')
  }
  const data = response.ok ? await parse(response) : null
  if (!data) return fromCache(deps.storage, 'error')
  const savedAt = deps.now().toISOString()
  try {
    deps.storage?.setItem(CACHE_KEY, JSON.stringify({ data, savedAt }))
  } catch {
    // Sin espacio o bloqueado: la página se ve igual, solo no queda guardada.
  }
  return { kind: 'fresh', data, savedAt }
}

async function parse(response: Response): Promise<PublicNoticesData | null> {
  try {
    const parsed = dataSchema.safeParse(await response.json())
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function fromCache(storage: Storage | null, otherwise: 'offline' | 'error'): LoadState {
  try {
    const raw = storage?.getItem(CACHE_KEY)
    const parsed = raw ? cacheSchema.safeParse(JSON.parse(raw)) : null
    if (parsed?.success) return { kind: 'cached', ...parsed.data }
  } catch {
    // Caché ilegible o almacenamiento bloqueado: como si no hubiera.
  }
  return { kind: otherwise }
}
