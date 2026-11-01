// Datos de prueba por tipo: normales y extremos (§5.7). Los usan normalize, las plantillas y la galería.
import type { AnnouncementTypeId } from '../../src/slides/types/fields'

export type TextTypeId = Exclude<AnnouncementTypeId, 'cumpleanos' | 'imagen'>

export const TEXT_TYPE_IDS: readonly TextTypeId[] = ['culto', 'salida', 'obra_misionera', 'actividad', 'aviso']

const LONG_TITLE = 'Gran campaña de evangelismo juvenil del distrito con invitados especiales de todas las iglesias'

export const NORMAL: Readonly<Record<TextTypeId, Record<string, unknown>>> = {
  culto: { titulo: 'Semana de oración', fecha: '2026-11-07', hora: '19:00', predicador: 'Pr. Juan Pérez', lugar: 'Templo central' },
  salida: { titulo: 'Excursión a Jarabacoa', fecha: '2026-11-14', horaSalida: '06:00', destino: 'Jarabacoa', precio: 1500 },
  obra_misionera: { titulo: 'Visitación casa por casa', fecha: '2026-11-08', hora: '09:00', puntoEncuentro: 'Frente al templo', zona: 'Los Mina' },
  actividad: { titulo: 'Noche de talentos', fecha: '2026-11-21', hora: '19:30', lugar: 'Salón social', precio: 0 },
  aviso: { titulo: 'Reunión de directiva', mensaje: 'Todos los directores de departamento están invitados después del culto.' },
}

/** Todos los campos opcionales llenos con textos razonables. */
export const FULL: Readonly<Record<TextTypeId, Record<string, unknown>>> = {
  culto: {
    ...NORMAL.culto,
    lema: 'Firmes en la esperanza',
    versiculo: 'Fíate de Jehová de todo tu corazón. Proverbios 3:5',
  },
  salida: {
    ...NORMAL.salida,
    puntoEncuentro: 'Parqueo de la iglesia',
    queLlevar: ['Agua', 'Gorra', 'Merienda'],
    fechaLimite: '2026-11-08',
    contacto: 'Hna. Ana 809-555-1234',
  },
  obra_misionera: { ...NORMAL.obra_misionera, queLlevar: ['Biblia', 'Folletos'], contacto: 'Hno. Luis 809-555-0000' },
  actividad: { ...NORMAL.actividad, descripcion: 'Canto, poesía y teatro para toda la familia.', contacto: 'Jóvenes' },
  aviso: { ...NORMAL.aviso, fecha: '2026-11-07', contacto: 'Secretaría' },
}

/** Solo los obligatorios. */
export const MINIMAL: Readonly<Record<TextTypeId, Record<string, unknown>>> = {
  culto: { titulo: 'Culto de adoración', fecha: '2026-11-07', hora: '10:00' },
  salida: { titulo: 'Paseo', fecha: '2026-11-14', horaSalida: '07:00' },
  obra_misionera: { titulo: 'Obra misionera', fecha: '2026-11-08', hora: '09:00' },
  actividad: { titulo: 'Convivio', fecha: '2026-11-21' },
  aviso: { titulo: 'Aviso', mensaje: 'Gracias por su puntualidad.' },
}

export const longTitle = (typeId: TextTypeId) => ({ ...NORMAL[typeId], titulo: LONG_TITLE })

/** 41 palabras de texto corrido (§5.4 permite ~40). */
export const FORTY_ONE_WORDS = Array.from({ length: 41 }, (_, i) => (i % 2 ? 'hermanos' : 'todos')).join(' ')
