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
  const done = shallowRef<ImportResult | null>(null)
  const applying = ref(false)
  const loaded = ref(false)

  // Lee el archivo pendiente (también si se elige otro desde esta pantalla) y lo deja en memoria aquí.
  watch(
    pendingImport,
    async (pending) => {
      if (!pending) return void (loaded.value = true)
      setPendingImport(null)
      done.value = null
      plan.value = null
      error.value = 'error' in pending ? pending.error : null
      if ('bundle' in pending) plan.value = await planImport(db, pending.bundle)
      loaded.value = true
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
        error.value = (e as Error).message
      } finally {
        applying.value = false
      }
    },
  }
}
