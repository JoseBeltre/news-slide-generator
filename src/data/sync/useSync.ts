// La sincronización para la interfaz (§8.4, RF-101): servicio, sesión y nube en un contexto que llega
// después de montar la app (cargar Supabase no retrasa abrir ni presentar sin internet).
import { computed, inject, shallowRef, type InjectionKey, type Plugin, type ShallowRef } from 'vue'
import type { AppDb } from '../local/db'
import { createAuth, type Auth } from './auth'
import { isPresenting, withSyncLock } from './locks'
import { createSyncService, type SyncService } from './service'
import { getClient } from './supabase'
import { createSupabaseRemote } from './supabaseRemote'
import type { SyncRemote } from './types'

export interface SyncContext {
  service: SyncService
  auth: Auth
  remote: SyncRemote
}

const KEY: InjectionKey<ShallowRef<SyncContext | null>> = Symbol('Sync')

export function syncPlugin(context: ShallowRef<SyncContext | null>): Plugin {
  return { install: (app) => void app.provide(KEY, context) }
}

/** `null` mientras carga o si este build no tiene nube. */
export function useSync(): ShallowRef<SyncContext | null> {
  return inject(KEY, shallowRef(null))
}

/** Crea el contexto si hay variables de Supabase; si no, `null` y la app sigue como siempre. */
export async function createSyncContext(db: AppDb): Promise<SyncContext | null> {
  const client = await getClient()
  if (!client) return null
  const auth = createAuth(client)
  const remote = createSupabaseRemote(client)
  const service = createSyncService({
    db,
    remote,
    signedIn: computed(() => auth.session.value !== null),
    isPresenting,
    withLock: withSyncLock,
  })
  await auth.ready.catch(() => {})
  service.start()
  return { service, auth, remote }
}
