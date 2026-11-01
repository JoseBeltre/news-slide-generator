// Color dominante de un logo (RF-37, §5.5): el motor lo usa para medir el contraste logo/fondo.
import { toHex } from '../slides/engine/color'

export interface Pixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

const SAMPLE_SIDE = 64

/**
 * Color más frecuente de los píxeles opacos (alfa ≥ 128), agrupados en cubetas de 4 bits por canal
 * y promediados dentro de la cubeta. Empate → la cubeta de clave numérica menor. Sin opacos → null.
 */
export function dominantColor(pixels: Pixels): string | null {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>()
  const { data } = pixels
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3]! < 128) continue
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
    bucket.count++
    bucket.r += r
    bucket.g += g
    bucket.b += b
    buckets.set(key, bucket)
  }
  let bestKey = -1
  let best: { count: number; r: number; g: number; b: number } | undefined
  for (const [key, bucket] of buckets) {
    if (!best || bucket.count > best.count || (bucket.count === best.count && key < bestKey)) {
      best = bucket
      bestKey = key
    }
  }
  if (!best) return null
  return toHex({ r: best.r / best.count, g: best.g / best.count, b: best.b / best.count })
}

async function decode(blob: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (blob.type === 'image/svg+xml') {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.src = url
    try {
      await img.decode()
    } catch (error) {
      URL.revokeObjectURL(url)
      throw error
    }
    // Un SVG solo con viewBox puede no tener tamaño natural: se muestrea cuadrado.
    return {
      source: img,
      width: img.naturalWidth || SAMPLE_SIDE,
      height: img.naturalHeight || SAMPLE_SIDE,
      release: () => URL.revokeObjectURL(url),
    }
  }
  const bitmap = await createImageBitmap(blob)
  return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
}

/** Color dominante de una imagen (PNG, JPEG, WebP o SVG); `null` si no se puede leer o es toda transparente. */
export async function dominantColorOfBlob(blob: Blob): Promise<string | null> {
  let decoded: Awaited<ReturnType<typeof decode>>
  try {
    decoded = await decode(blob)
  } catch {
    return null
  }
  try {
    const scale = Math.min(1, SAMPLE_SIDE / Math.max(decoded.width, decoded.height))
    const width = Math.max(1, Math.round(decoded.width * scale))
    const height = Math.max(1, Math.round(decoded.height * scale))
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(decoded.source, 0, 0, width, height)
    return dominantColor(ctx.getImageData(0, 0, width, height))
  } finally {
    decoded.release()
  }
}
