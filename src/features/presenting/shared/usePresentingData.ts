// Lo que necesitan las pantallas de presentar: la presentación, sus slides con su contexto y el total.
import { computed, type Ref } from 'vue'
import { usePresentationRecord } from '../../presentations/shared/usePresentationRecord'
import { usePresentationSlides } from '../../presentations/shared/usePresentationSlides'

export function usePresentingData(id: Ref<string>) {
  const { presentation, missing, byId } = usePresentationRecord(id)
  const { ctx, slides } = usePresentationSlides(presentation, byId)
  const total = computed(() => slides.value.length)
  return { presentation, missing, byId, ctx, slides, total }
}
