import { describe, expect, it } from 'vitest'
import { getTypeDef } from '../../../src/slides/types/definitions'
import { MESSAGES, validateValues, type Person } from '../../../src/slides/types/validation'

const culto = getTypeDef('culto')
const cumple = getTypeDef('cumpleanos')
const salida = getTypeDef('salida')
const aviso = getTypeDef('aviso')
const imagen = getTypeDef('imagen')
const CULTO_OK = { titulo: 'Culto joven', fecha: '2026-11-07', hora: '19:00' }

describe('mensajes (RF-04)', () => {
  it('textos exactos en español', () => {
    expect(MESSAGES).toEqual({
      required: 'Este campo es obligatorio.',
      date: 'La fecha no es válida.',
      time: 'La hora no es válida.',
      money: 'El precio no puede ser negativo.',
      list: 'Agrega al menos un elemento.',
      choice: 'Elige una opción.',
      peopleEmpty: 'Agrega al menos una persona.',
      personName: 'Escribe el nombre.',
      personDayMonth: 'El día o el mes no es válido.',
      personDayInMonth: 'Ese día no existe en ese mes.',
    })
  })
})

describe('validateValues', () => {
  it('culto mínimo válido; recorta y quita opcionales vacíos', () => {
    expect(validateValues(culto, { titulo: '  Culto joven ', fecha: '2026-11-07', hora: '19:00', lugar: '  ' })).toEqual({
      ok: true,
      values: CULTO_OK,
    })
  })

  it('faltan obligatorios → "obligatorio" en cada uno', () => {
    expect(validateValues(culto, {})).toEqual({
      ok: false,
      errors: { titulo: MESSAGES.required, fecha: MESSAGES.required, hora: MESSAGES.required },
    })
    expect(validateValues(culto, { titulo: '   ', fecha: '', hora: '' })).toEqual({
      ok: false,
      errors: { titulo: MESSAGES.required, fecha: MESSAGES.required, hora: MESSAGES.required },
    })
  })

  it('fecha y hora presentes pero mal formadas', () => {
    expect(validateValues(culto, { ...CULTO_OK, fecha: '2026-02-30', hora: '25:00' })).toEqual({
      ok: false,
      errors: { fecha: MESSAGES.date, hora: MESSAGES.time },
    })
  })

  it('un opcional mal formado también es error', () => {
    const r = validateValues(salida, { titulo: 'Playa', fecha: '2026-11-21', horaSalida: '06:00', fechaLimite: '31/12' })
    expect(r).toEqual({ ok: false, errors: { fechaLimite: MESSAGES.date } })
  })

  it('precio: negativo es error; 0 y decimales valen', () => {
    const base = { titulo: 'Playa', fecha: '2026-11-21', horaSalida: '06:00' }
    expect(validateValues(salida, { ...base, precio: -1 })).toEqual({ ok: false, errors: { precio: MESSAGES.money } })
    expect(validateValues(salida, { ...base, precio: 0 })).toEqual({ ok: true, values: { ...base, precio: 0 } })
    expect(validateValues(salida, { ...base, precio: 1500.5 })).toMatchObject({ ok: true })
    expect(validateValues(salida, { ...base, precio: Number.NaN })).toEqual({ ok: false, errors: { precio: MESSAGES.money } })
  })

  it('qué llevar: recorta y quita vacíos; lista vacía opcional desaparece', () => {
    const base = { titulo: 'Playa', fecha: '2026-11-21', horaSalida: '06:00' }
    expect(validateValues(salida, { ...base, queLlevar: [' Biblia ', '', 'Agua'] })).toEqual({
      ok: true,
      values: { ...base, queLlevar: ['Biblia', 'Agua'] },
    })
    expect(validateValues(salida, { ...base, queLlevar: ['  '] })).toEqual({ ok: true, values: base })
  })

  it('imagen obligatoria', () => {
    expect(validateValues(imagen, {})).toEqual({ ok: false, errors: { imagen: MESSAGES.required } })
    expect(validateValues(imagen, { imagen: 'img-1', tituloInterno: ' Flyer ' })).toEqual({
      ok: true,
      values: { imagen: 'img-1', tituloInterno: 'Flyer' },
    })
  })

  it('aviso: mensaje largo obligatorio', () => {
    expect(validateValues(aviso, { titulo: 'Ayuno' })).toEqual({ ok: false, errors: { mensaje: MESSAGES.required } })
  })

  it('claves desconocidas se descartan', () => {
    expect(validateValues(culto, { ...CULTO_OK, extra: 1 })).toEqual({ ok: true, values: CULTO_OK })
  })

  it('maxLength no se impone (es orientativo)', () => {
    const largo = 'x'.repeat(500)
    expect(validateValues(culto, { ...CULTO_OK, titulo: largo })).toEqual({ ok: true, values: { ...CULTO_OK, titulo: largo } })
  })
})

describe('cumpleaños', () => {
  it('modo y mensaje por defecto', () => {
    expect(validateValues(cumple, { personas: [{ name: 'Ana', day: 3, month: 11 }] })).toEqual({
      ok: true,
      values: { modo: 'individual', personas: [{ name: 'Ana', day: 3, month: 11 }], mensaje: '¡Feliz cumpleaños!' },
    })
  })

  it('modo inválido', () => {
    expect(validateValues(cumple, { modo: 'mensual', personas: [{ name: 'Ana', day: 3, month: 11 }] })).toEqual({
      ok: false,
      errors: { modo: MESSAGES.choice },
    })
  })

  it('29 de febrero es válido; 31 de abril y 30 de febrero no', () => {
    expect(validateValues(cumple, { personas: [{ name: 'Ana', day: 29, month: 2 }] }).ok).toBe(true)
    expect(validateValues(cumple, { personas: [{ name: 'Ana', day: 31, month: 4 }] })).toEqual({
      ok: false,
      errors: { 'personas.0': MESSAGES.personDayInMonth },
    })
    expect(validateValues(cumple, { personas: [{ name: 'Ana', day: 30, month: 2 }] })).toEqual({
      ok: false,
      errors: { 'personas.0': MESSAGES.personDayInMonth },
    })
  })

  it('sin personas, nombre vacío, día o mes fuera de rango', () => {
    expect(validateValues(cumple, {})).toEqual({ ok: false, errors: { personas: MESSAGES.peopleEmpty } })
    expect(validateValues(cumple, { personas: [] })).toEqual({ ok: false, errors: { personas: MESSAGES.peopleEmpty } })
    expect(validateValues(cumple, { personas: [{ name: '  ', day: 3, month: 11 }] })).toEqual({
      ok: false,
      errors: { 'personas.0.name': MESSAGES.personName },
    })
    expect(validateValues(cumple, { personas: [{ name: 'Ana', day: 0, month: 11 }, { name: 'Luis', day: 3, month: 13 }] })).toEqual({
      ok: false,
      errors: { 'personas.0.day': MESSAGES.personDayMonth, 'personas.1.month': MESSAGES.personDayMonth },
    })
  })

  it('recorta el nombre y conserva la foto; no guarda año ni edad', () => {
    const r = validateValues(cumple, { personas: [{ name: ' Ana ', day: 3, month: 11, photoId: 'f1', year: 1990, edad: 36 }] })
    expect(r).toEqual({
      ok: true,
      values: {
        modo: 'individual',
        personas: [{ name: 'Ana', day: 3, month: 11, photoId: 'f1' }],
        mensaje: '¡Feliz cumpleaños!',
      },
    })
  })
})

describe('foto de cumpleañero quitada (revisión final P2)', () => {
  it('photoId vacío o null equivale a sin foto, sin errores en inglés', () => {
    const cumple = getTypeDef('cumpleanos')
    for (const photoId of ['', null, '  ']) {
      const r = validateValues(cumple, { personas: [{ name: 'Ana', day: 3, month: 11, photoId }] })
      expect(r, String(photoId)).toMatchObject({ ok: true })
      if (r.ok) expect((r.values.personas as Person[])[0]!.photoId).toBeUndefined()
    }
  })
})
