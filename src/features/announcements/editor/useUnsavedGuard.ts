// Cambios sin guardar: pregunta antes de ir a otra pantalla o a otro anuncio, y avisa el navegador
// al recargar o cerrar.
import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useConfirm } from '../../../ui/useConfirm'

export function useUnsavedGuard(dirty: Ref<boolean>): void {
  const confirm = useConfirm()

  const ask = () => (dirty.value ? confirm({ title: '¿Salir sin guardar?', confirmLabel: 'Salir sin guardar', danger: true }) : true)
  onBeforeRouteLeave(ask)
  // Misma pantalla, otro anuncio (/anuncios/A → /anuncios/B): el editor se rehace y perdería los cambios.
  onBeforeRouteUpdate((to, from) => (to.params.id !== from.params.id || to.params.typeId !== from.params.typeId ? ask() : true))

  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (dirty.value) e.preventDefault()
  }
  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
}
