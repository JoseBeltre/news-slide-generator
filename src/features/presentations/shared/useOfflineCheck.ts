// Corre la comprobación sin internet (RF-55) sobre la presentación abierta. Comprueba sola al abrir y
// cuando algo cambia; `prepare()` además pide almacenamiento persistente (RF-102). El entorno del
// navegador se puede reemplazar con provide(OFFLINE_ENV) (pruebas).
import { inject, ref, shallowRef, watch, type InjectionKey, type Ref } from 'vue'
import { getImageBlob } from '../../../data/local/images'
import type { Announcement, Presentation } from '../../../data/models'
import { checkOffline, type OfflineEnv, type OfflineReport } from '../../../data/offline'
import { browserOfflineEnv } from '../../../data/offlineEnv'
import { downloadMissingImages } from '../../../data/sync/images'
import { useDb } from '../../../data/useDb'
import { useSync } from '../../../data/sync/useSync'
import type { SlideContext, SlideStatus } from '../../../slides/templates/contract'

export const OFFLINE_ENV: InjectionKey<OfflineEnv> = Symbol('OfflineEnv')

export interface CheckInput {
  presentation: Presentation
  byId: ReadonlyMap<string, Announcement>
  ctx: SlideContext
  measured?: ReadonlyMap<string, SlideStatus['status']>
}

export function useOfflineCheck(input: Ref<CheckInput | undefined>) {
  const db = useDb()
  const sync = useSync()
  const base = inject(OFFLINE_ENV, undefined) ?? browserOfflineEnv()
  /** Con la nube, las imágenes que bajaron sin su archivo se descargan antes de comprobar (P8). */
  const env = {
    ...base,
    downloadMissing: async () => {
      const remote = sync.value?.remote
      if (remote) await downloadMissingImages(db, remote)
      await base.downloadMissing?.()
    },
  }
  const report = shallowRef<OfflineReport>()
  const checking = ref(false)
  let run = 0
  /** Lo que respondió el navegador al preparar; las comprobaciones siguientes no lo vuelven a pedir. */
  let persistent = true

  async function check(persist = false) {
    const value = input.value
    if (!value) return
    const mine = ++run
    checking.value = true
    const hasImage = async (id: string) => (await getImageBlob(db, id)) !== undefined
    const result = await checkOffline({ ...value, hasImage }, env, { persist })
    if (persist) persistent = result.persistent
    if (mine !== run) return
    report.value = { ...result, persistent }
    checking.value = false
  }

  async function prepare() {
    await check(true)
  }

  watch(input, () => void check(), { immediate: true })
  return { report, checking, prepare }
}
