// Copia profunda de datos que pueden venir dentro de proxies de Vue (reactive, readonly):
// structuredClone e IndexedDB no aceptan proxies.
import { isProxy, toRaw } from 'vue'

function unwrap<V>(value: V): V {
  const raw = isProxy(value) ? toRaw(value) : value
  if (Array.isArray(raw)) return raw.map(unwrap) as V
  if (raw && typeof raw === 'object' && Object.getPrototypeOf(raw) === Object.prototype) {
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, unwrap(v)])) as V
  }
  return raw
}

/** Copia independiente y sin proxies (los Blob y fechas se copian con structuredClone). */
export function plainCopy<V>(value: V): V {
  return structuredClone(unwrap(value))
}
