// Copia local de un valor de lista (chips, personas): cada cambio parte de la última versión
// aunque el padre todavía no haya devuelto la anterior (dos cambios en el mismo instante).
import { ref, watch, type Ref } from 'vue'

export function useListModel<T>(source: () => unknown, emit: (next: T[] | undefined) => void) {
  const read = () => (Array.isArray(source()) ? [...(source() as T[])] : [])
  const items: Ref<T[]> = ref(read()) as Ref<T[]>
  watch(source, () => (items.value = read()))

  /** Reemplaza la lista; una lista vacía se guarda como "sin valor". */
  function set(next: T[]) {
    items.value = next
    emit(next.length ? next : undefined)
  }
  return { items, set }
}
