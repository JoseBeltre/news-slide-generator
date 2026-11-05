// Tamaños legibles (es-DO, base 1024): "0 B", "1,5 KB", "120 MB".
const UNITS = ['B', 'KB', 'MB', 'GB'] as const
const NUMBER = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 1 })

export function formatBytes(n: number): string {
  let value = Math.max(0, n)
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit++
  }
  return `${NUMBER.format(value)} ${UNITS[unit]}`
}
