// Textos e iconos de cada estado de la sincronización (RF-101), en español y sin jerga.
import { CloudAlert, CloudCheck, CloudOff, CloudUpload, LogIn } from '@lucide/vue'
import type { Component } from 'vue'
import type { SyncStatus } from '../../data/sync/status'

type Visible = Exclude<SyncStatus, 'desactivado'>

export const STATUS_ICON: Record<Visible, Component> = {
  sincronizado: CloudCheck,
  pendiente: CloudUpload,
  'sin-conexion': CloudOff,
  'sin-sesion': LogIn,
  'nube-no-responde': CloudAlert,
}

export function statusLabel(status: Visible, pending: number): string {
  switch (status) {
    case 'sincronizado':
      return 'Sincronizado'
    case 'pendiente':
      return `Cambios pendientes · ${pending}`
    case 'sin-conexion':
      return 'Sin conexión'
    case 'sin-sesion':
      return 'Entra para sincronizar'
    case 'nube-no-responde':
      return 'La nube no responde'
  }
}

/** La frase del panel: qué pasa y que lo guardado está a salvo. */
export function statusDetail(status: Visible): string {
  switch (status) {
    case 'sincronizado':
      return 'Todo lo de este equipo está en la nube.'
    case 'pendiente':
      return 'Hay cambios guardados en este equipo que se subirán en unos segundos.'
    case 'sin-conexion':
      return 'Tus cambios están guardados en este equipo y se subirán al volver internet.'
    case 'sin-sesion':
      return 'Entra con tu correo para compartir los cambios con el resto del equipo.'
    case 'nube-no-responde':
      return 'Tus cambios están guardados en este equipo. Se vuelve a intentar solo.'
  }
}
