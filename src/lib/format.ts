// Formato de datos para las slides en es-DO (§3.2). Fechas 'YYYY-MM-DD' y horas 'HH:mm',
// siempre en hora local: `new Date('YYYY-MM-DD')` es UTC y en RD mostraría el día anterior.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/

/** 'YYYY-MM-DD' → medianoche local. Lanza `RangeError` si el formato o la fecha no son válidos. */
export function parseLocalDate(iso: string): Date {
  const m = ISO_DATE.exec(iso)
  if (!m) throw new RangeError(`Fecha no válida: ${JSON.stringify(iso)}`)
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(y, mo - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    throw new RangeError(`Fecha no válida: ${JSON.stringify(iso)}`)
  }
  return date
}

/** "Sábado 7 de noviembre"; con año solo si no es el de `today`. */
export function formatDate(iso: string, opts: { today?: Date } = {}): string {
  const date = parseLocalDate(iso)
  const today = opts.today ?? new Date()
  const withYear = date.getFullYear() !== today.getFullYear()
  const text = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(date)
  const sinComa = text.replace(',', '')
  return sinComa.charAt(0).toLocaleUpperCase('es-DO') + sinComa.slice(1)
}

/** "7:00 p. m." (12 h, como lo da Intl) o "19:00" (24 h). */
export function formatTime(hhmm: string, opts: { timeFormat?: '12h' | '24h' } = {}): string {
  const m = HH_MM.exec(hhmm)
  if (!m) throw new RangeError(`Hora no válida: ${JSON.stringify(hhmm)}`)
  if (opts.timeFormat === '24h') return hhmm
  const date = new Date(2000, 0, 1, Number(m[1]), Number(m[2]))
  return new Intl.DateTimeFormat('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
}

/** "RD$500", "RD$1,500.50"; sin decimales si son ,00. Un precio de 0 es "Gratis". */
export function formatMoney(amount: number, opts: { currency?: string } = {}): string {
  // Redondear a centavos antes de decidir: 1500.999 se ve como "RD$1,501", nunca "RD$1,501.00".
  amount = Math.round(amount * 100) / 100
  if (amount === 0) return 'Gratis'
  const whole = Number.isInteger(amount)
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: opts.currency ?? 'DOP',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
