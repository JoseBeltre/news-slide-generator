// Monta la app real (App.vue: marco, rutas y diálogo de confirmación) con una base de datos de prueba.
// Lo usan las pruebas de las pantallas de la interfaz.
import { createMemoryHistory } from 'vue-router'
import App from '../../../src/app/App.vue'
import { createAppRouter } from '../../../src/app/router'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { createRepository, type NewRecord } from '../../../src/data/local/repository'
import type { Announcement } from '../../../src/data/models'
import { dbPlugin } from '../../../src/data/useDb'
import { toIsoDate } from '../../../src/lib/format'
import { frame, mountInHost } from './mount'
import { until } from './slides'

export { until }

const dbs: AppDb[] = []

export function testDb(): AppDb {
  const db = createDb(`app-test-${crypto.randomUUID()}`)
  dbs.push(db)
  return db
}

/** Borra las bases de prueba; llamar en `afterEach` junto con `cleanupMounted`. */
export async function cleanupDbs() {
  for (const db of dbs.splice(0)) await db.delete()
}

/** 'YYYY-MM-DD' a `n` días de hoy. */
export function daysFromToday(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toIsoDate(d)
}

export async function seed(db: AppDb, partial: Partial<NewRecord<Announcement>> & { typeId: string }) {
  return createRepository(db.announcements).put({
    templateId: 'clasica',
    logo: { kind: 'iglesia' },
    values: {},
    imageIds: [],
    status: 'listo',
    createdAt: new Date().toISOString(),
    ...partial,
  })
}

export async function mountApp(path: string, db: AppDb, size = { width: 1280, height: 900 }) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  const mounted = mountInHost(App, size.width, size.height, { global: { plugins: [router, dbPlugin(db)] } })
  await frame()
  return { ...mounted, router }
}

/** Botón o enlace por su texto visible o su aria-label. */
export function byLabel(root: ParentNode, label: string | RegExp): HTMLElement | undefined {
  const matches = (s: string | null) => s !== null && (typeof label === 'string' ? s.trim() === label : label.test(s))
  return [...root.querySelectorAll<HTMLElement>('button, a, [role="radio"]')].find(
    (el) => matches(el.getAttribute('aria-label')) || matches(el.textContent),
  )
}
