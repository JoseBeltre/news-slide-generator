// Atenúa la vista previa un instante cuando cambia `key` (estilo, plantilla o tema), para que el cambio
// se funda en vez de saltar. El texto que se teclea no cambia la clave, así que no parpadea.
import { onBeforeUnmount, ref, watch } from 'vue'

/** Cuánto dura atenuada antes de volver a la opacidad plena. */
export const FADE_MS = 90

export function useFadeOnChange(key: () => string) {
  const dim = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(key, () => {
    dim.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (dim.value = false), FADE_MS)
  })
  onBeforeUnmount(() => clearTimeout(timer))
  return dim
}
