// Cambios sin guardar: pregunta antes de ir a otra pantalla y avisa el navegador al recargar o cerrar.
import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useConfirm } from '../../../ui/useConfirm'

export function useUnsavedGuard(dirty: Ref<boolean>): void {
  const confirm = useConfirm()

  onBeforeRouteLeave(() =>
    dirty.value ? confirm({ title: '¿Salir sin guardar?', confirmLabel: 'Salir sin guardar', danger: true }) : true,
  )

  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (dirty.value) e.preventDefault()
  }
  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
}
