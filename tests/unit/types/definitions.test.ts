import { describe, expect, it } from 'vitest'
import { ANNOUNCEMENT_TYPES, getTypeDef } from '../../../src/slides/types/definitions'
import { templatesFor } from '../../../src/slides/templates/registry'

const obligatorios = (id: string) =>
  getTypeDef(id)
    .fields.filter((f) => f.required)
    .map((f) => f.key)

describe('tipos de anuncio del MVP (§3.2)', () => {
  it('los 7 tipos del MVP, en orden', () => {
    expect(ANNOUNCEMENT_TYPES.map((t) => t.id)).toEqual([
      'culto',
      'salida',
      'obra_misionera',
      'cumpleanos',
      'actividad',
      'aviso',
      'imagen',
    ])
  })

  it.each([
    ['culto', ['titulo', 'fecha', 'hora']],
    ['salida', ['titulo', 'fecha', 'horaSalida']],
    ['obra_misionera', ['titulo', 'fecha', 'hora']],
    ['cumpleanos', ['modo', 'personas']],
    ['actividad', ['titulo', 'fecha']],
    ['aviso', ['titulo', 'mensaje']],
    ['imagen', ['imagen']],
  ])('obligatorios de %s', (id, claves) => {
    expect(obligatorios(id)).toEqual(claves)
  })

  it.each([
    ['culto', ['titulo', 'fecha', 'hora', 'predicador', 'fotoPredicador', 'lugar', 'lema', 'versiculo']],
    ['salida', ['titulo', 'fecha', 'horaSalida', 'destino', 'puntoEncuentro', 'precio', 'queLlevar', 'fechaLimite', 'contacto']],
    ['obra_misionera', ['titulo', 'fecha', 'hora', 'puntoEncuentro', 'zona', 'queLlevar', 'contacto']],
    ['cumpleanos', ['modo', 'personas', 'mostrarDia', 'mensaje', 'versiculo']],
    ['actividad', ['titulo', 'fecha', 'hora', 'lugar', 'descripcion', 'precio', 'contacto']],
    ['aviso', ['titulo', 'mensaje', 'fecha', 'contacto']],
    ['imagen', ['imagen', 'tituloInterno']],
  ])('campos de %s, en orden', (id, claves) => {
    expect(getTypeDef(id).fields.map((f) => f.key)).toEqual(claves)
  })

  it('claves únicas por tipo, etiquetas no vacías y nombre e ícono del tipo', () => {
    for (const t of ANNOUNCEMENT_TYPES) {
      expect(new Set(t.fields.map((f) => f.key)).size).toBe(t.fields.length)
      for (const f of t.fields) expect(f.label.trim()).not.toBe('')
      expect(t.name.trim()).not.toBe('')
      expect(t.icon.trim()).not.toBe('')
    }
  })

  // La Visual es la Clásica con una foto: solo la ofrecen los tipos que tienen un campo de imagen.
  it('Visual solo en los tipos de texto con un campo de imagen; imagen tiene la suya', () => {
    for (const t of ANNOUNCEMENT_TYPES) {
      const hasImage = t.fields.some((f) => f.kind === 'image')
      if (t.id === 'imagen') expect(t.templateIds).toEqual(['imagen'])
      else if (t.id === 'cumpleanos') expect(t.templateIds).toEqual(['cumpleanos'])
      else expect(t.templateIds).toEqual(hasImage ? ['clasica', 'visual'] : ['clasica'])
      expect(t.templateIds).toContain(t.defaultTemplateId)
    }
    expect(getTypeDef('culto').templateIds).toEqual(['clasica', 'visual'])
  })

  it('templatesFor coincide con los templateIds de cada tipo', () => {
    for (const t of ANNOUNCEMENT_TYPES) {
      expect(templatesFor(t.id).map((x) => x.id)).toEqual(t.templateIds)
    }
  })

  it('los datos clave tienen ícono; solo los choice tienen opciones', () => {
    for (const t of ANNOUNCEMENT_TYPES) {
      for (const f of t.fields) {
        if (f.role === 'key') expect(f.icon).toBeTruthy()
        expect(f.options !== undefined).toBe(f.kind === 'choice')
      }
    }
  })

  it('modo de cumpleaños: opciones de RF-21 y "Uno por slide" por defecto', () => {
    const modo = getTypeDef('cumpleanos').fields.find((f) => f.key === 'modo')!
    expect(modo.kind).toBe('choice')
    expect(modo.options).toEqual([
      { value: 'individual', label: 'Uno por slide' },
      { value: 'grupo', label: 'Varios en una slide' },
      { value: 'hibrido', label: 'Híbrido' },
    ])
    expect(modo.defaultValue).toBe('individual')
  })

  it('mensaje de cumpleaños por defecto', () => {
    const mensaje = getTypeDef('cumpleanos').fields.find((f) => f.key === 'mensaje')!
    expect(mensaje.defaultValue).toBe('¡Feliz cumpleaños!')
  })

  it('cumpleaños no pide año ni edad (privacidad §3.3)', () => {
    for (const f of getTypeDef('cumpleanos').fields) {
      expect(`${f.key} ${f.label}`).not.toMatch(/año|edad|nacimiento/i)
    }
  })

  it('el título interno de una imagen nunca se proyecta', () => {
    expect(getTypeDef('imagen').fields.find((f) => f.key === 'tituloInterno')!.role).toBe('presenter-only')
  })

  it('getTypeDef de un tipo desconocido lanza', () => {
    expect(() => getTypeDef('recaudacion')).toThrow()
  })
})

describe('fecha principal (una sola regla)', () => {
  it('hasMainDate: los tipos con campo "fecha" de tipo date', async () => {
    const { hasMainDate } = await import('../../../src/slides/types/fields')
    const { getTypeDef } = await import('../../../src/slides/types/definitions')
    expect(['culto', 'salida', 'obra_misionera', 'actividad', 'aviso'].every((t) => hasMainDate(getTypeDef(t)))).toBe(true)
    expect(hasMainDate(getTypeDef('cumpleanos'))).toBe(false)
    expect(hasMainDate(getTypeDef('imagen'))).toBe(false)
  })
})
