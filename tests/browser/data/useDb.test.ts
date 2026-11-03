import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
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

  it('con deps: vuelve a consultar cuando cambia el valor que lee la consulta', async () => {
    const db = createDb(`usedb-${crypto.randomUUID()}`)
    dbs.push(db)
    await createRepository(db.settings).put({ ...DEFAULT_SETTINGS, id: SETTINGS_ID, churchName: 'Uno' })
    await createRepository(db.settings).put({ ...DEFAULT_SETTINGS, id: 'otra', churchName: 'Dos' })
    const id = ref(SETTINGS_ID)
    const Comp = defineComponent({
      setup() {
        const db = useDb()
        const name = useLiveQuery(async () => (await db.settings.get(id.value))?.churchName ?? '', '', id)
        return () => h('output', name.value)
      },
    })
    const { host } = mountInHost(Comp, 100, 50, { global: { plugins: [dbPlugin(db)] } })
    await until(() => host.textContent === 'Uno')
    id.value = 'otra'
    await until(() => host.textContent === 'Dos')
  })

  it('sin dbPlugin, useDb explica qué falta', () => {
    const Comp = defineComponent({ setup: () => (useDb(), () => h('div')) })
    expect(() => mountInHost(Comp, 10, 10)).toThrow(/dbPlugin/)
  })
})
