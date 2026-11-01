// Estilos de slide (§9, v1.4): los tres sirven para todos los tipos de anuncio menos cumpleaños.
// Se elige uno por defecto en Configuración y cada anuncio puede cambiarlo.
export type SlideStyleId = 'himnario' | 'almanaque' | 'cartel'

export const SLIDE_STYLES: readonly { id: SlideStyleId; name: string }[] = Object.freeze([
  { id: 'himnario', name: 'Himnario' },
  { id: 'almanaque', name: 'Almanaque' },
  { id: 'cartel', name: 'Cartel' },
])

export const DEFAULT_SLIDE_STYLE: SlideStyleId = 'almanaque'
