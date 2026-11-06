// El aviso (snackbar) que sigue a guardar un anuncio. "Volver" lo agrega quien lo muestra.
import type { Announcement } from '../../../data/models'
import type { SnackTone } from '../../../ui/useSnackbar'

export interface SaveNotice {
  message: string
  tone: SnackTone
  success?: boolean
}

export function saveNotice(input: { status: Announcement['status']; offline: boolean }): SaveNotice {
  if (input.status === 'no_cabe') return { message: 'Guardado, pero el texto no cabe en la slide', tone: 'warning' }
  if (input.offline) return { message: 'Sin conexión: guardado en este dispositivo, se subirá al volver internet', tone: 'warning' }
  if (input.status === 'borrador') return { message: 'Guardado como borrador', tone: 'normal', success: true }
  return { message: 'Anuncio guardado', tone: 'normal', success: true }
}
