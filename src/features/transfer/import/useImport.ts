// La revisión de una importación (RF-112): toma el archivo pendiente, calcula el plan contra este
// equipo y lo cambia (copia o sobrescribir, casillas, otra fecha) sin mutarlo; al final lo aplica.
import { ref, shallowRef, watch } from 'vue'
import { applyImport, type ImportResult } from '../../../data/transfer/apply'
import { planImport, type ImportPlan, type Resolution } from '../../../data/transfer/plan'
import { useDb } from '../../../data/useDb'
import { pendingImport, setPendingImport } from '../shared/pendingImport'

export function useImport() {
  const db = useDb()
  const plan = shallowRef<ImportPlan | null>(null)
  const error = ref<string | null>(null)
  /** Sube con cada fallo: el mismo mensaje dos veces seguidas debe avisar otra vez. */
  const errorTick = ref(0)
  const fail = (message: string) => {
    error.value = message
    errorTick.value++
  }
  const done = shallowRef<ImportResult | null>(null)
  const applying = ref(false)
  const loaded = ref(false)

  // Lee el archivo pendiente (también si se elige otro desde esta pantalla) y lo deja en memoria aquí.
  // Solo cuenta el último: si llegan dos seguidos, el plan del primero se descarta.
  let generation = 0
  watch(
    pendingImport,
    async (pending) => {
      if (!pending) {
        if (!generation) loaded.value = true
        return
      }
      const mine = ++generation
      loaded.value = false
      setPendingImport(null)
      done.value = null
      plan.value = null
      error.value = null
      if ('error' in pending) fail(pending.error)
      if (!('bundle' in pending)) return void (loaded.value = true)
      try {
        const next = await planImport(db, pending.bundle)
        if (mine === generation) plan.value = next
      } catch {
        if (mine === generation) fail('No se pudo preparar la importación.')
      } finally {
        if (mine === generation) loaded.value = true
      }
    },
    { immediate: true },
  )

  const change = (fn: (p: ImportPlan) => Partial<ImportPlan>) => {
    if (plan.value) plan.value = { ...plan.value, ...fn(plan.value) }
  }
  const mapItem = (id: string, patch: (a: ImportPlan['announcements'][number]) => object) =>
    change((p) => ({ announcements: p.announcements.map((a) => (a.id === id ? { ...a, ...patch(a) } : a)) }))

  return {
    plan,
    error,
    errorTick,
    done,
    applying,
    loaded,
    setResolution: (id: string, resolution: Resolution) => mapItem(id, () => ({ resolution })),
    toggle: (id: string) => mapItem(id, (a) => ({ included: !a.included })),
    setPresentationResolution: (resolution: Resolution) => change((p) => ({ presentation: p.presentation && { ...p.presentation, resolution } })),
    setTargetDate: (targetDate: string) => change((p) => ({ presentation: p.presentation && { ...p.presentation, targetDate } })),
    async apply() {
      if (!plan.value || applying.value) return
      applying.value = true
      try {
        done.value = await applyImport(db, plan.value)
        error.value = null
      } catch (e) {
        fail((e as Error).message)
      } finally {
        applying.value = false
      }
    },
  }
}
