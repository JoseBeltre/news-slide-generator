import { afterEach, describe, expect, it } from 'vitest'
import { createDb, type AppDb } from '../../../src/data/local/db'
import { InvalidImageError, MAX_SIDE, WEBP_QUALITY, getImageBlob, saveImage } from '../../../src/data/local/images'

const opened: AppDb[] = []
let n = 0
function db() {
  const d = createDb(`images-test-${Date.now()}-${++n}`)
  opened.push(d)
  return d
}
afterEach(async () => {
  for (const d of opened.splice(0)) await d.delete()
})

/** PNG de prueba generado en el navegador: degradado para que no sea trivial de comprimir. */
async function png(width: number, height: number): Promise<Blob> {
  const c = new OffscreenCanvas(width, height)
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, width, height)
  g.addColorStop(0, '#0b1f3a')
  g.addColorStop(1, '#ff9800')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, width, height)
  return c.convertToBlob({ type: 'image/png' })
}

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200"><rect width="600" height="200" fill="#1e5aa8"/></svg>'
const svgBlob = () => new Blob([SVG], { type: 'image/svg+xml' })
const dims = async (b: Blob) => {
  const bmp = await createImageBitmap(b)
  return [bmp.width, bmp.height]
}
const clock = () => new Date(Date.UTC(2026, 10, 1, 12, 0))

describe('saveImage (RNF-04)', () => {
  it('límites y calidad', () => {
    expect(MAX_SIDE).toEqual({ default: 2560, foto: 1600 })
    expect(WEBP_QUALITY).toBe(0.82)
  })

  it('foto de 4000×3000 → WebP de 1600×1200', async () => {
    const d = db()
    const a = await saveImage(d, await png(4000, 3000), 'foto', clock)
    expect([a.width, a.height, a.kind]).toEqual([1600, 1200, 'foto'])
    const blob = (await getImageBlob(d, a.id))!
    expect(blob.type).toBe('image/webp')
    expect(await dims(blob)).toEqual([1600, 1200])
  })

  it('flyer de 4000×3000 → 2560×1920; uno vertical de 800×1200 no se agranda', async () => {
    const d = db()
    const grande = await saveImage(d, await png(4000, 3000), 'flyer', clock)
    expect([grande.width, grande.height]).toEqual([2560, 1920])
    const vertical = await saveImage(d, await png(800, 1200), 'flyer', clock)
    expect([vertical.width, vertical.height]).toEqual([800, 1200])
    expect((await getImageBlob(d, vertical.id))!.type).toBe('image/webp')
  })

  it('SVG se guarda tal cual, con medidas del viewBox', async () => {
    const d = db()
    const a = await saveImage(d, svgBlob(), 'logo', clock)
    expect([a.width, a.height]).toEqual([600, 200])
    expect(a.storagePath).toMatch(/^images\/[0-9a-f]{64}\.svg$/)
    const blob = (await getImageBlob(d, a.id))!
    expect(blob.type).toBe('image/svg+xml')
    expect(await blob.text()).toBe(SVG)
  })

  it('hash SHA-256 en hex y ruta basada en él; metadatos de sincronización', async () => {
    const a = await saveImage(db(), await png(100, 100), 'foto', clock)
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/)
    expect(a.storagePath).toBe(`images/${a.hash}.webp`)
    expect(a.updatedAt).toBe('2026-11-01T12:00:00.000Z')
  })

  it('la misma imagen dos veces → un solo registro', async () => {
    const d = db()
    const file = await png(300, 200)
    const a = await saveImage(d, file, 'foto', clock)
    const b = await saveImage(d, file, 'foto', clock)
    expect(b.id).toBe(a.id)
    expect(await d.images.count()).toBe(1)
    expect(await d.imageBlobs.count()).toBe(1)
  })

  it('volver a subir una imagen borrada la revive en lugar de chocar con el índice único', async () => {
    const d = db()
    const file = await png(300, 200)
    const a = await saveImage(d, file, 'foto', clock)
    await d.images.update(a.id, { deletedAt: '2026-11-01T12:30:00.000Z' })
    const later = () => new Date(Date.UTC(2026, 10, 2, 9, 0))
    const b = await saveImage(d, file, 'foto', later)
    expect(b.id).toBe(a.id)
    expect(b.deletedAt).toBeNull()
    expect(b.updatedAt).toBe('2026-11-02T09:00:00.000Z')
    expect(await d.images.count()).toBe(1)
  })

  it.each([
    ['texto plano', () => new Blob(['hola'], { type: 'text/plain' })],
    ['PNG corrupto', () => new Blob(['no soy un png'], { type: 'image/png' })],
    ['SVG sin medidas', () => new Blob(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], { type: 'image/svg+xml' })],
    ['SVG que no es SVG', () => new Blob(['<html></html>'], { type: 'image/svg+xml' })],
  ])('%s → InvalidImageError y nada guardado', async (_, make) => {
    const d = db()
    await expect(saveImage(d, make(), 'foto', clock)).rejects.toBeInstanceOf(InvalidImageError)
    await expect(saveImage(d, make(), 'foto', clock)).rejects.toThrow(
      'No se pudo leer la imagen. Usa un archivo PNG, JPG, WebP o SVG.',
    )
    expect(await d.images.count()).toBe(0)
    expect(await d.imageBlobs.count()).toBe(0)
  })

  it('getImageBlob de un id inexistente → undefined', async () => {
    expect(await getImageBlob(db(), 'no-existe')).toBeUndefined()
  })
})
