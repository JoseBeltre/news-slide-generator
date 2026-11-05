// El archivo elegido para importar, en memoria (no en Dexie): recargar la página vuelve a pedirlo.
import { shallowRef } from 'vue'
import type { TransferBundle } from '../../../data/transfer/format'

export type PendingImport = { bundle: TransferBundle } | { error: string } | null

export const pendingImport = shallowRef<PendingImport>(null)

export function setPendingImport(value: PendingImport): void {
  pendingImport.value = value
}
