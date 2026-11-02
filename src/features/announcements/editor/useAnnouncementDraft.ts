// Borrador del editor (RF-03): de él salen el formulario, la validación (RF-04) y la vista previa.
// Guardar espera a que la slide termine de medirse, para no guardar "listo" algo que no cabe (RF-10).
import { computed, nextTick, ref, watch, type Ref } from 'vue'
import { eventDateOf, statusFor } from '../../../data/announcements'
import type { NewRecord, Repository } from '../../../data/local/repository'
import type { Announcement } from '../../../data/models'
import { plainCopy } from '../../../lib/plain'
import type { SlideContext, SlideSpec, SlideStatus } from '../../../slides/templates/contract'
import { buildSlides } from '../../../slides/templates/registry'
import { getTypeDef } from '../../../slides/types/definitions'
import { validateValues, type Person } from '../../../slides/types/validation'

/** Tiempo máximo que guardar espera a la medición; después guarda como borrador. */
export const MEASURE_TIMEOUT_MS = 2000

/** Ids de las imágenes que usa el anuncio (campos de imagen y fotos de personas). */
function imageIdsOf(typeId: string, values: Record<string, unknown>): string[] {
  const ids = getTypeDef(typeId).fields.flatMap((f) => {
    const v = values[f.key]
    if (f.kind === 'image') return typeof v === 'string' && v ? [v] : []
    if (f.kind === 'people' && Array.isArray(v)) return (v as Person[]).flatMap((p) => (p?.photoId ? [p.photoId] : []))
    return []
  })
  return [...new Set(ids)]
}

export function useAnnouncementDraft(initial: NewRecord<Announcement>, ctx: Ref<SlideContext>, repo: Repository<Announcement>) {
  const draft = ref(plainCopy(initial)) as Ref<NewRecord<Announcement>>
  const snapshot = (d: NewRecord<Announcement>) => JSON.stringify({ ...d, id: undefined })
  const baseline = ref(snapshot(draft.value))

  const typeDef = computed(() => getTypeDef(draft.value.typeId))
  const validation = computed(() => validateValues(typeDef.value, draft.value.values))
  // Un dato a medio escribir o que ya no valida (una fecha rota) no debe dejar el editor en blanco:
  // sin slides hasta que se corrija; el formulario muestra el error.
  const slides = computed<SlideSpec[]>(() => {
    try {
      return buildSlides(draft.value, ctx.value)
    } catch {
      return []
    }
  })
  const slideStatus = ref<SlideStatus>({ status: 'midiendo', offendingFields: [] })
  const dirty = computed(() => snapshot(draft.value) !== baseline.value)

  /** Estado de la slide en cuanto deja de medirse, o 'midiendo' si pasa el tiempo máximo. */
  function measuredStatus(): Promise<SlideStatus['status']> {
    if (slideStatus.value.status !== 'midiendo') return Promise.resolve(slideStatus.value.status)
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        stop()
        resolve('midiendo')
      }, MEASURE_TIMEOUT_MS)
      const stop = watch(slideStatus, (s) => {
        if (s.status === 'midiendo') return
        clearTimeout(timer)
        stop()
        resolve(s.status)
      })
    })
  }

  async function save(): Promise<Announcement> {
    const valid = validation.value.ok
    // Un cambio recién hecho (otro estilo, una tecla) todavía no llegó a la vista previa: se espera a que
    // la slide se vuelva a dibujar, que la deja en "midiendo" hasta medir los textos nuevos.
    if (valid) await nextTick()
    const measured = valid ? await measuredStatus() : 'ok'
    const status = measured === 'midiendo' ? 'borrador' : statusFor(valid, measured)
    const d = draft.value
    const record = { ...d, status, eventDate: eventDateOf(d.typeId, d.values), imageIds: imageIdsOf(d.typeId, d.values) }
    // La línea base es lo que se envía, no lo que haya al terminar: lo que se teclee mientras se escribe
    // en la base de datos queda como cambio pendiente.
    const sent = snapshot(record)
    const saved = await repo.put(record)
    draft.value.id = saved.id
    draft.value.status = saved.status
    draft.value.eventDate = saved.eventDate
    draft.value.imageIds = saved.imageIds
    baseline.value = sent
    return saved
  }

  return { draft, typeDef, validation, slides, slideStatus, dirty, save }
}
