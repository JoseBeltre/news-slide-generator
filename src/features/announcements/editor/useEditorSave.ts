// Guardar desde el editor: el botón muestra su spinner y su ✓, y el resultado sale en el snackbar
// (guardado con "Volver", advertencia si no cabe o no hay conexión, error con "Reintentar").
import { onBeforeUnmount, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Announcement } from '../../../data/models'
import { useSync } from '../../../data/sync/useSync'
import { useBusy } from '../../../ui/useBusy'
import { dismiss, notify } from '../../../ui/useSnackbar'
import { markNewAnnouncement } from '../shared/useRowMotion'
import { saveNotice } from './saveNotice'

export function useEditorSave(opts: {
  save: () => Promise<Announcement>
  /** Si el anuncio todavía no se había guardado nunca. */
  isNew: () => boolean
  submitted: Ref<boolean>
  /** Foto del contenido del formulario: Reintentar solo guarda si no cambió desde el fallo. */
  version: () => string
  onFirstSave: (saved: Announcement) => void | Promise<void>
}) {
  const router = useRouter()
  const sync = useSync()
  const { state, run } = useBusy()
  let errorNoticeId: number | undefined
  // Al salir del editor el aviso de error se descarta: Reintentar ya no tiene a qué volver.
  onBeforeUnmount(() => {
    if (errorNoticeId !== undefined) dismiss(errorNoticeId)
  })

  const onSave = (): Promise<boolean | undefined> =>
    run(async () => {
      opts.submitted.value = true
      try {
        const wasNew = opts.isNew()
        const saved = await opts.save()
        const offline = sync.value?.service.state.value.status === 'sin-conexion'
        notify({ ...saveNotice({ status: saved.status, offline }), action: { label: 'Volver', run: () => void router.push({ name: 'anuncios' }) } })
        if (wasNew) {
          markNewAnnouncement(saved.id)
          await opts.onFirstSave(saved)
        }
        return true
      } catch {
        const failedVersion = opts.version()
        errorNoticeId = notify({
          message: 'No se pudo guardar en este dispositivo.',
          tone: 'error',
          action: { label: 'Reintentar', run: () => void (opts.version() === failedVersion && onSave()) },
        })
        return false
      }
    })

  return { state, onSave }
}
