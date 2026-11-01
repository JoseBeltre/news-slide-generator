// Búsqueda binaria del tamaño de fuente (§5.6, paso 2). Pura: la medición la inyecta quien llama.

/** ¿Cabe el texto con este tamaño? Se supone monótona: si cabe a N, cabe a N − 1. */
export type FitProbe = (fontSize: number) => boolean

/** Mayor tamaño entero en [min, max] que cabe, o `null` si no cabe ni con `min`. */
export function findLargestFittingSize(range: { min: number; max: number }, fits: FitProbe): number | null {
  const { min, max } = range
  const valid = (n: number) => Number.isInteger(n) && n > 0
  if (!valid(min) || !valid(max) || min > max) {
    throw new RangeError(`Rango de tamaño no válido: [${min}, ${max}]`)
  }
  if (!fits(min)) return null

  let lo = min // siempre cabe
  let hi = max
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (fits(mid)) lo = mid
    else hi = mid - 1
  }
  return lo
}
