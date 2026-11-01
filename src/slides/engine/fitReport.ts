// Estado "No cabe" de una slide a partir de los informes de sus slots (§5.6, RF-10).
import type { FitReport } from './types'

export interface FitSummary {
  status: 'ok' | 'no_cabe'
  offendingSlots: string[]
  offendingFields: string[]
}

/** `no_cabe` si algún slot no cabe con su mínimo. Los slots vacíos no cuentan. */
export function summarizeFit(reports: readonly FitReport[]): FitSummary {
  const slots = new Set<string>()
  const fields = new Set<string>()
  for (const r of reports) {
    if (r.result.status !== 'too_long') continue
    slots.add(r.slotId)
    if (r.fieldKey) fields.add(r.fieldKey)
  }
  return {
    status: slots.size > 0 ? 'no_cabe' : 'ok',
    offendingSlots: [...slots],
    offendingFields: [...fields],
  }
}
