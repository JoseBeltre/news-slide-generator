// Tipos compartidos del motor. Todas las medidas son px del lienzo lógico 1920×1080.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Rol del texto según §5.3; decide el tamaño mínimo y el peso. */
export type TextRole = 'title' | 'key' | 'secondary' | 'birthdayNameSingle' | 'birthdayNameGroup' | 'meta'

/** Slot de texto que declara una plantilla. */
export interface TextSlotDef {
  id: string
  role: TextRole
  box: Rect
  /** Campo del formulario que alimenta el slot (para señalar "No cabe", RF-10). */
  fieldKey?: string
  /** Nunca menor que el mínimo del rol. */
  minFontSize?: number
  /** Por defecto, el máximo preferido del rol. */
  maxFontSize?: number
  maxLines?: number
  /** Solo permitido con `maxLines: 1` (§5.2). */
  uppercase?: boolean
  align?: 'left' | 'center' | 'right'
  /** Posición vertical del texto en su caja; no cambia el ajuste. Por defecto, arriba. */
  valign?: 'top' | 'center' | 'bottom'
}

/** Resultado del ajuste de un texto a su slot (§5.6). */
export type FitResult =
  | { status: 'fits'; fontSize: number; lines: number; belowPreferred: boolean }
  | { status: 'too_long'; minFontSize: number }
  | { status: 'empty' }

/** Lo que informa cada slot de texto tras medirse; la plantilla los junta con `summarizeFit`. */
export interface FitReport {
  slotId: string
  fieldKey?: string
  result: FitResult
}
