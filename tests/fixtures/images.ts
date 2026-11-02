// Imágenes sintéticas para pruebas y galería (sin archivos binarios en el repo). Solo en el navegador.

/** Flyer de prueba: degradado con bandas, para que el relleno difuminado se note. */
export async function syntheticFlyer(width: number, height: number): Promise<Blob> {
  const c = new OffscreenCanvas(width, height)
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, '#d64545')
  grad.addColorStop(1, '#f2b632')
  g.fillStyle = grad
  g.fillRect(0, 0, width, height)
  g.fillStyle = '#12325e'
  for (let i = 0; i < 4; i++) g.fillRect(0, (height / 4) * i + height / 16, width, height / 16)
  return c.convertToBlob({ type: 'image/png' })
}

/**
 * Foto recortada de prueba (PNG sin fondo): una silueta de busto, como la foto de un predicador.
 * Transparente alrededor, apoyada en el borde inferior.
 */
export async function syntheticCutout(width = 800, height = 1000): Promise<Blob> {
  const c = new OffscreenCanvas(width, height)
  const g = c.getContext('2d')!
  g.fillStyle = '#6b4a3a'
  g.beginPath()
  g.ellipse(width / 2, height * 0.3, width * 0.17, height * 0.17, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#1f2a44'
  g.beginPath()
  g.moveTo(width * 0.08, height)
  g.bezierCurveTo(width * 0.1, height * 0.55, width * 0.9, height * 0.55, width * 0.92, height)
  g.closePath()
  g.fill()
  return c.convertToBlob({ type: 'image/png' })
}

/**
 * Foto de cumpleaños de prueba: una foto normal (con fondo), retrato con cabeza y hombros. El tono
 * del fondo cambia con `hue` para distinguir a las personas en la galería.
 */
export async function syntheticPortrait(hue = 200, width = 600, height = 750): Promise<Blob> {
  const c = new OffscreenCanvas(width, height)
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, `hsl(${hue} 45% 62%)`)
  grad.addColorStop(1, `hsl(${(hue + 40) % 360} 40% 38%)`)
  g.fillStyle = grad
  g.fillRect(0, 0, width, height)
  g.fillStyle = '#8a5a44'
  g.beginPath()
  g.ellipse(width / 2, height * 0.38, width * 0.19, height * 0.19, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = `hsl(${(hue + 180) % 360} 35% 30%)`
  g.beginPath()
  g.moveTo(width * 0.06, height)
  g.bezierCurveTo(width * 0.1, height * 0.62, width * 0.9, height * 0.62, width * 0.94, height)
  g.closePath()
  g.fill()
  return c.convertToBlob({ type: 'image/png' })
}
