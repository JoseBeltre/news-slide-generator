// Mensajes de "No cabe" en el campo culpable (RF-10).
import type { SlideStatus } from '../../../slides/templates/contract'

export const FIT_MESSAGE =
  'Este texto es muy largo para leerse bien desde lejos; acórtalo o muévelo a las notas del presentador.'
export const DENSITY_MESSAGE =
  'Hay demasiados datos para una slide; acorta este campo o muévelo a las notas del presentador.'

/** Campo → mensaje, para los campos que hacen que la slide no quepa. */
export function flaggedFields(status: SlideStatus): Record<string, string> {
  if (status.status !== 'no_cabe') return {}
  const message = status.reason === 'density' ? DENSITY_MESSAGE : FIT_MESSAGE
  return Object.fromEntries(status.offendingFields.map((key) => [key, message]))
}
