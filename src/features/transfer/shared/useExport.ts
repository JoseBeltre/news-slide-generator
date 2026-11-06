// Exportar un anuncio o una presentación a un .zip (RF-112). Si falla, un aviso de error con
// "Reintentar" (snackbar); el botón que lo use muestra el spinner y el ✓ con `state`.
import { exportAnnouncement, exportPresentation } from '../../../data/transfer/pack'
import { useDb } from '../../../data/useDb'
import { useBusy } from '../../../ui/useBusy'
import { notify } from '../../../ui/useSnackbar'
import { downloadBlob } from './download'

export function useExport(kind: 'anuncio' | 'presentacion', id: () => string) {
  const db = useDb()
  const { state, run: busyRun } = useBusy()

  async function exportNow(): Promise<boolean> {
    try {
      const file = await (kind === 'anuncio' ? exportAnnouncement(db, id()) : exportPresentation(db, id()))
      downloadBlob(file.name, file.blob)
      return true
    } catch {
      notify({ message: 'No se pudo exportar.', tone: 'error', action: { label: 'Reintentar', run: () => void run() } })
      return false
    }
  }

  const run = () => busyRun(exportNow)
  return { state, run }
}
