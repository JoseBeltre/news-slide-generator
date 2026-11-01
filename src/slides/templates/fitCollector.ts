// Cada texto de una slide informa su ajuste a la SlideView que lo contiene (provide/inject),
// así las plantillas no cablean eventos a mano.
import { inject, type InjectionKey } from 'vue'
import type { FitReport } from '../engine'

export const FIT_COLLECTOR: InjectionKey<(report: FitReport) => void> = Symbol('fit-collector')

export function useFitReporter(): (report: FitReport) => void {
  return inject(FIT_COLLECTOR, () => {})
}
