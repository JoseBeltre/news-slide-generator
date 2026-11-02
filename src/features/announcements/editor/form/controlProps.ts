// Contrato común de los controles de campo: FieldControl los monta todos igual.
import type { FieldDef } from '../../../../slides/types/fields'

export interface ControlProps {
  /** `campo-<key>`: lo usa la etiqueta y el enlace "No cabe" para llevar al campo. */
  id: string
  field: FieldDef
  modelValue: unknown
  invalid: boolean
  describedBy?: string
}
