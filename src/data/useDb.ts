// Acceso a la base de datos desde la interfaz: una AppDb por app (plugin + inject) y consultas
// vivas de Dexie como refs de Vue.
import { liveQuery } from 'dexie'
import { inject, onScopeDispose, readonly, shallowRef, watch, type InjectionKey, type Plugin, type Ref, type WatchSource } from 'vue'
import type { AppDb } from './local/db'

const DB_KEY: InjectionKey<AppDb> = Symbol('AppDb')

/** `app.use(dbPlugin(db))` en main.ts; en las pruebas, `global: { plugins: [dbPlugin(db)] }`. */
export function dbPlugin(db: AppDb): Plugin {
  return { install: (app) => void app.provide(DB_KEY, db) }
}

export function useDb(): AppDb {
  const db = inject(DB_KEY)
  if (!db) throw new Error('No hay base de datos: falta app.use(dbPlugin(db)).')
  return db
}

/**
 * Resultado de `query`, actualizado cada vez que cambian las tablas que lee. Con `deps`, también se
 * vuelve a consultar cuando cambia ese valor (p. ej. la id de la ruta). Se cancela al desmontar.
 */
export function useLiveQuery<T>(query: () => Promise<T>, initial: T, deps?: WatchSource): Readonly<Ref<T>> {
  const result = shallowRef(initial) as Ref<T>
  let subscription: { unsubscribe(): void } | undefined
  const subscribe = () => {
    subscription?.unsubscribe()
    subscription = liveQuery(query).subscribe({
      next: (value) => (result.value = value),
      error: (e) => console.error('Consulta de la base de datos falló', e),
    })
  }
  subscribe()
  if (deps) watch(deps, subscribe)
  onScopeDispose(() => subscription?.unsubscribe())
  return readonly(result) as Readonly<Ref<T>>
}
