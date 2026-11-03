// Contexto y slides de una presentación (RF-54), con su fecha: los usan la pantalla y la tarjeta de Inicio.
import { computed, type Ref } from 'vue'
import type { Announcement, Presentation } from '../../../data/models'
import { presentationContext, presentationSlides } from '../../../data/presentations'
import { useSlideContext } from '../../../data/useSlideContext'

export function usePresentationSlides(p: Ref<Presentation | undefined>, byId: Ref<ReadonlyMap<string, Announcement>>) {
  const base = useSlideContext(computed(() => p.value?.date))
  const ctx = computed(() => (p.value ? presentationContext(p.value, base.value) : base.value))
  const slides = computed(() => (p.value ? presentationSlides(p.value, byId.value, base.value) : []))
  const count = computed(() => (slides.value.length === 1 ? '1 slide' : `${slides.value.length} slides`))
  return { base, ctx, slides, count }
}
