// Colores de fiesta de los cumpleaños (pedido del responsable: no solo rosado): rojo, azul, amarillo,
// verde y el color del tipo, un poco mezclados con el fondo para que no griten. Solo decoración.
import { mixColors, type SlidePalette } from '../../themes'

const HUES = ['#e2574c', '#3d7fd6', '#f0b43a', '#3aa984']
const SOFTEN = 0.16

/** Los 5 colores, rotados por `variant` para que dos adornos iguales no se vean idénticos. */
export function festiveColors(palette: SlidePalette, variant = 0): string[] {
  const ground = palette.background[0]!
  const all = [...HUES, palette.accent].map((c) => mixColors(c, ground, SOFTEN))
  const k = variant % all.length
  return [...all.slice(k), ...all.slice(0, k)]
}
