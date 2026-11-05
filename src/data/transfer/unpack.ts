// Leer un archivo de traspaso (RF-112): descomprimir, validar y devolver el contenido con los archivos
// de imagen. Nada se escribe aquí; cualquier fallo es TransferFormatError.
import { strFromU8, unzipSync } from 'fflate'
import { CONTENT_FILE, IMAGES_DIR, TransferFormatError, transferFileSchema, type TransferBundle, type TransferFile } from './format'

const MIME: Record<string, string> = { webp: 'image/webp', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }
const IMAGE_PATH = /^imagenes\/([0-9a-f]{64})\.(\w+)$/

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function readTransferFile(file: Blob): Promise<TransferBundle> {
  let entries: Record<string, Uint8Array>
  let parsed: unknown
  try {
    entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (f) => f.name === CONTENT_FILE || f.name.startsWith(IMAGES_DIR),
    })
    parsed = JSON.parse(strFromU8(entries[CONTENT_FILE]!))
  } catch {
    throw new TransferFormatError()
  }
  const result = transferFileSchema.safeParse(parsed)
  if (!result.success) throw new TransferFormatError()

  const blobs = new Map<string, Blob>()
  for (const [path, bytes] of Object.entries(entries)) {
    const match = IMAGE_PATH.exec(path)
    // Un archivo que no es lo que dice su hash no entra: podría tapar otra foto con la misma ruta.
    if (!match || (await sha256Hex(bytes)) !== match[1]) continue
    const type = MIME[match[2]!.toLowerCase()] ?? 'application/octet-stream'
    blobs.set(match[1]!, new Blob([bytes as Uint8Array<ArrayBuffer>], { type }))
  }
  return { content: result.data as unknown as TransferFile, blobs }
}
