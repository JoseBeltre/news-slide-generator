// Direcciones visuales de las slides (Tarea 5): el responsable elige una. Todas respetan §5:
// la decoración vive en los márgenes o detrás del título con su propio contraste, nunca bajo texto sin verificar.
export type DecorationVariant = 'sobria' | 'banda' | 'calida'

export const DECORATION_VARIANTS: readonly DecorationVariant[] = ['sobria', 'banda', 'calida']

/** Variante usada por las plantillas mientras no se pida otra. */
export const DEFAULT_DECORATION: DecorationVariant = 'sobria'

export const CHIP_RADIUS: Readonly<Record<DecorationVariant, string>> = {
  sobria: '50%',
  banda: '22%',
  calida: '999px',
}
