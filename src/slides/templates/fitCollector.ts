// Cada texto de una slide informa su ajuste a la SlideView que lo contiene (provide/inject),
// así las plantillas no cablean eventos a mano. La SlideView sabe qué textos están montados y cuáles
// ya se midieron: mientras falte alguno, la slide está "midiendo", nunca "ok".
import { inject, type InjectionKey } from 'vue'
import type { FitReport } from '../engine'

export interface FitCollector {
  /** Un texto montado, aún sin medir. */
  register: (slotId: string) => void
  /** Su texto o su caja cambiaron: hay que volver a medir. */
  invalidate: (slotId: string) => void
  report: (report: FitReport) => void
  /** Se desmontó: deja de contar. */
  forget: (slotId: string) => void
}

export const FIT_COLLECTOR: InjectionKey<FitCollector> = Symbol('fit-collector')

const NOOP: FitCollector = { register: () => {}, invalidate: () => {}, report: () => {}, forget: () => {} }

export function useFitCollector(): FitCollector {
  return inject(FIT_COLLECTOR, NOOP)
}
