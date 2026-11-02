import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { createRepository } from '../../../src/data/local/repository'
import { DEFAULT_SETTINGS, SETTINGS_ID } from '../../../src/data/settings'
import { dbPlugin, useDb, useLiveQuery } from '../../../src/data/useDb'
import { cleanupMounted, mountInHost } from '../helpers/mount'
import { until } from '../helpers/slides'

const dbs: AppDb[] = []
afterEach(async () => {
  cleanupMounted()
  for (const db of dbs.splice(0)) await db.delete()
})

function mountCounter(db: AppDb) {
  const Comp = defineComponent({
    setup() {
      const db = useDb()
      const count = useLiveQuery(() => db.settings.count(), -1)
      return () => h('output', String(count.value))
    },
  })
  return mountInHost(Comp, 100, 50, { global: { plugins: [dbPlugin(db)] } })
}

describe('useLiveQuery', () => {
  it('se actualiza al cambiar la tabla', async () => {
    const db = createDb(`usedb-${crypto.randomUUID()}`)
    dbs.push(db)
    const { host } = mountCounter(db)
    await until(() => host.textContent === '0')
    await createRepository(db.settings).put({ ...DEFAULT_SETTINGS, id: SETTINGS_ID })
    await until(() => host.textContent === '1')
  })

  it('sin dbPlugin, useDb explica qué falta', () => {
    const Comp = defineComponent({ setup: () => (useDb(), () => h('div')) })
    expect(() => mountInHost(Comp, 10, 10)).toThrow(/dbPlugin/)
  })
})
