// Texturas de fondo: SVG locales y deterministas. Un texto puesto sobre una textura declara en su
// data-bg las paradas del fondo más las mismas mezcladas con el trazo, así auditSlide mide el peor caso.
import { mixColors } from '../../themes'

export type TextureKind = 'tela' | 'renglones' | 'trama'

export function texturedStops(stops: readonly string[], ink: string, opacity: number): string[] {
  return [...stops, ...stops.map((s) => mixColors(s, ink, opacity))]
}
