// Navegación del celular: los destinos de la barra inferior y la dirección del cambio de página.
// «Presentar» lleva a la lista de presentaciones (de ahí se elige cuál presentar); «Ajustes» es Configuración.

export interface NavItem {
  key: string
  label: string
  to: { name: string }
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'inicio', label: 'Inicio', to: { name: 'inicio' } },
  { key: 'anuncios', label: 'Anuncios', to: { name: 'anuncios' } },
  { key: 'presentar', label: 'Presentar', to: { name: 'presentaciones' } },
  { key: 'ajustes', label: 'Ajustes', to: { name: 'configuracion' } },
]

/** Ruta → [destino de la barra, profundidad dentro de él]. Importar cuelga de Inicio. */
const PLACE: Record<string, readonly [number, number]> = {
  inicio: [0, 0],
  importar: [0, 1],
  anuncios: [1, 0],
  nuevo: [1, 1],
  'nuevo-tipo': [1, 2],
  editar: [1, 1],
  presentaciones: [2, 0],
  presentacion: [2, 1],
  configuracion: [3, 0],
}

/** Qué destino de la barra marca la ruta (-1: ninguno, como Entrar o Presentar). */
export const navIndexFor = (name: unknown): number => PLACE[String(name)]?.[0] ?? -1

/** Para animar el cambio de página: 1 si se va hacia adelante (a la derecha o más adentro), -1 si se vuelve. */
export function pageDirection(from: unknown, to: unknown): 1 | -1 {
  const a = PLACE[String(from)]
  const b = PLACE[String(to)]
  if (!a || !b) return 1
  const order = (p: readonly [number, number]) => p[0] * 10 + p[1]
  return order(b) < order(a) ? -1 : 1
}

/** Clave de la pantalla: nuevo y guardado son el mismo editor, y guardar no debe recargarlo. */
export const pageKey = (name: unknown): string => (name === 'nuevo-tipo' ? 'editar' : String(name))
