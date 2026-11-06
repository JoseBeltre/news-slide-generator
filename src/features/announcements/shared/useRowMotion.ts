// Movimiento de la lista de anuncios: filas escalonadas (30 ms) solo la primera vez que se carga la lista
// en la sesión, y resaltado (~1 s) de lo que aparece nuevo: recién guardado en el editor o llegado de
// otro lado (importar, sincronizar) con la lista ya abierta.
import { onBeforeUnmount, ref, watch } from 'vue'

export const STAGGER_MS = 30
export const HIGHLIGHT_MS = 1100

let staggered = false
let justSaved: string | undefined

/** El editor avisa del anuncio que acaba de guardar por primera vez. */
export const markNewAnnouncement = (id: string): void => void (justSaved = id)
/** La lista lo recoge (una sola vez) para resaltarlo. */
export function takeNewAnnouncement(): string | undefined {
  const id = justSaved
  justSaved = undefined
  return id
}
/** Para las pruebas. */
export function resetRowMotion(): void {
  staggered = false
  justSaved = undefined
}

export function useRowMotion(ids: () => string[], loaded: () => boolean) {
  const stagger = !staggered
  const highlighted = ref(new Set<string>())
  /** Verdadero cuando ya llegó la primera carga: desde ahí, lo que entre es nuevo de verdad. */
  const settled = ref(false)
  let known = new Set<string>()
  const timers = new Set<ReturnType<typeof setTimeout>>()

  function highlight(newIds: string[]) {
    if (!newIds.length) return
    highlighted.value = new Set([...highlighted.value, ...newIds])
    const t = setTimeout(() => {
      timers.delete(t)
      highlighted.value = new Set([...highlighted.value].filter((id) => !newIds.includes(id)))
    }, HIGHLIGHT_MS)
    timers.add(t)
  }

  watch(
    [ids, loaded],
    ([list, isLoaded]) => {
      if (!isLoaded) return
      if (!settled.value) {
        settled.value = true
        staggered = true
        const saved = takeNewAnnouncement()
        if (saved && list.includes(saved)) highlight([saved])
      } else {
        highlight(list.filter((id) => !known.has(id)))
      }
      known = new Set(list)
    },
    { immediate: true, flush: 'post' },
  )
  onBeforeUnmount(() => timers.forEach(clearTimeout))

  return {
    stagger,
    settled,
    highlighted,
    delayOf: (i: number): string | undefined => (stagger ? `${i * STAGGER_MS}ms` : undefined),
  }
}
