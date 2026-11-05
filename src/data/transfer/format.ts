// Formato del archivo de traspaso (RF-112): un .zip con `contenido.json` (este esquema) y las imágenes
// en `imagenes/<hash>.<ext>`. Se valida la forma antes de tocar nada; lo extra se conserva.
import { z } from 'zod'
import { ANNOUNCEMENT_TYPES } from '../../slides/types/definitions'
import type { Announcement, ImageAsset, Presentation } from '../models'

export const TRANSFER_FORMAT = 'anuncios-del-sabado'
export const TRANSFER_VERSION = 1
export const CONTENT_FILE = 'contenido.json'
export const IMAGES_DIR = 'imagenes/'

export interface TransferFile {
  formato: typeof TRANSFER_FORMAT
  version: typeof TRANSFER_VERSION
  tipo: 'anuncio' | 'presentacion'
  exportadoEn: string
  presentation?: Presentation
  announcements: Announcement[]
  images: ImageAsset[]
}

export interface TransferBundle {
  content: TransferFile
  /** Archivo de cada imagen por su hash; falta si el equipo que exportó no lo tenía. */
  blobs: Map<string, Blob>
}

export class TransferFormatError extends Error {
  constructor() {
    super('Este archivo no es una exportación de Anuncios del Sábado.')
    this.name = 'TransferFormatError'
  }
}

const meta = { id: z.string().min(1), updatedAt: z.string(), deletedAt: z.string().nullish() }
const typeIds = ANNOUNCEMENT_TYPES.map((t) => t.id) as [string, ...string[]]

const announcement = z.looseObject({
  ...meta,
  typeId: z.enum(typeIds),
  templateId: z.string(),
  logo: z.looseObject({ kind: z.string() }),
  values: z.record(z.string(), z.unknown()),
  imageIds: z.array(z.string()),
  status: z.enum(['borrador', 'listo', 'no_cabe']),
  createdAt: z.string(),
})

const presentation = z.looseObject({
  ...meta,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(z.looseObject({ announcementId: z.string() })),
  showCover: z.boolean(),
  showClosing: z.boolean(),
  published: z.boolean(),
})

const image = z.looseObject({
  ...meta,
  storagePath: z.string(),
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  width: z.number(),
  height: z.number(),
  kind: z.enum(['foto', 'flyer', 'logo', 'asset']),
})

export const transferFileSchema = z
  .object({
    formato: z.literal(TRANSFER_FORMAT),
    version: z.literal(TRANSFER_VERSION),
    tipo: z.enum(['anuncio', 'presentacion']),
    exportadoEn: z.string(),
    presentation: presentation.optional(),
    announcements: z.array(announcement),
    images: z.array(image),
  })
  .superRefine((f, ctx) => {
    const ok = f.tipo === 'anuncio' ? f.announcements.length === 1 && !f.presentation : !!f.presentation
    if (!ok) ctx.addIssue({ code: 'custom', message: 'El contenido no coincide con el tipo' })
  })
