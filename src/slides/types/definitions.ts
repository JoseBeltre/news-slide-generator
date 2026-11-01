// Los 7 tipos de anuncio del MVP (§3.2).
import type { AnnouncementTypeDef, FieldDef } from './fields'

// ---- Campos que se repiten entre tipos ----
const titulo: FieldDef = { key: 'titulo', label: 'Título', kind: 'text', required: true, role: 'title', maxLength: 60 }
const fecha: FieldDef = { key: 'fecha', label: 'Fecha', kind: 'date', required: true, role: 'key', icon: 'calendar' }
const hora: FieldDef = { key: 'hora', label: 'Hora', kind: 'time', required: true, role: 'key', icon: 'clock' }
const lugar: FieldDef = { key: 'lugar', label: 'Lugar', kind: 'text', required: false, role: 'key', icon: 'map-pin', maxLength: 50 }
const precio: FieldDef = { key: 'precio', label: 'Precio', kind: 'money', required: false, role: 'key', icon: 'banknote' }
const contacto: FieldDef = {
  key: 'contacto',
  label: 'Contacto',
  kind: 'text',
  required: false,
  role: 'secondary',
  icon: 'phone',
  maxLength: 40,
}
const puntoEncuentro: FieldDef = {
  key: 'puntoEncuentro',
  label: 'Punto de encuentro',
  kind: 'text',
  required: false,
  role: 'key',
  icon: 'flag',
  maxLength: 50,
}
const queLlevar: FieldDef = {
  key: 'queLlevar',
  label: 'Qué llevar',
  kind: 'list',
  required: false,
  role: 'secondary',
  icon: 'backpack',
  slidePrefix: 'Llevar:',
  maxLength: 80,
}
const versiculo: FieldDef = {
  key: 'versiculo',
  label: 'Versículo',
  kind: 'longtext',
  required: false,
  role: 'secondary',
  icon: 'book-open',
  maxLength: 140,
}

const optional = (field: FieldDef): FieldDef => ({ ...field, required: false })
const DESIGNED = { templateIds: ['clasica', 'visual'], defaultTemplateId: 'clasica' }

export const ANNOUNCEMENT_TYPES: readonly AnnouncementTypeDef[] = Object.freeze([
  {
    id: 'culto',
    name: 'Culto / Servicio especial',
    icon: 'church',
    fields: [
      titulo,
      fecha,
      hora,
      { key: 'predicador', label: 'Predicador/a', kind: 'text', required: false, role: 'key', icon: 'user', maxLength: 40 },
      { key: 'fotoPredicador', label: 'Foto del predicador (PNG sin fondo)', kind: 'image', required: false },
      lugar,
      { key: 'lema', label: 'Tema o lema', kind: 'text', required: false, role: 'secondary', icon: 'quote', maxLength: 80 },
      versiculo,
    ],
    ...DESIGNED,
  },
  {
    id: 'salida',
    name: 'Salida / Excursión',
    icon: 'bus',
    fields: [
      titulo,
      fecha,
      { ...hora, key: 'horaSalida', label: 'Hora de salida' },
      { key: 'destino', label: 'Destino', kind: 'text', required: false, role: 'key', icon: 'map-pin', maxLength: 50 },
      puntoEncuentro,
      precio,
      queLlevar,
      {
        key: 'fechaLimite',
        label: 'Fecha límite de pago o inscripción',
        kind: 'date',
        required: false,
        role: 'secondary',
        icon: 'calendar-clock',
        slidePrefix: 'Hasta el',
      },
      contacto,
    ],
    ...DESIGNED,
  },
  {
    id: 'obra_misionera',
    name: 'Obra misionera / Evangelismo',
    icon: 'megaphone',
    fields: [
      titulo,
      fecha,
      hora,
      puntoEncuentro,
      { key: 'zona', label: 'Zona o sector', kind: 'text', required: false, role: 'key', icon: 'map', maxLength: 50 },
      queLlevar,
      contacto,
    ],
    ...DESIGNED,
  },
  {
    id: 'cumpleanos',
    name: 'Cumpleaños',
    icon: 'cake',
    fields: [
      {
        key: 'modo',
        label: 'Modo de presentación',
        kind: 'choice',
        required: true,
        options: [
          { value: 'individual', label: 'Uno por slide' },
          { value: 'grupo', label: 'Varios en una slide' },
          { value: 'hibrido', label: 'Híbrido' },
        ],
        defaultValue: 'individual',
      },
      { key: 'personas', label: 'Personas', kind: 'people', required: true },
      {
        key: 'mensaje',
        label: 'Mensaje',
        kind: 'text',
        required: false,
        role: 'secondary',
        maxLength: 60,
        defaultValue: '¡Feliz cumpleaños!',
      },
      versiculo,
    ],
    ...DESIGNED,
  },
  {
    id: 'actividad',
    name: 'Actividad general',
    icon: 'calendar-days',
    fields: [
      titulo,
      fecha,
      optional(hora),
      lugar,
      { key: 'descripcion', label: 'Descripción corta', kind: 'longtext', required: false, role: 'secondary', maxLength: 120 },
      precio,
      contacto,
    ],
    ...DESIGNED,
  },
  {
    id: 'aviso',
    name: 'Aviso breve',
    icon: 'message-square',
    fields: [
      titulo,
      { key: 'mensaje', label: 'Mensaje', kind: 'longtext', required: true, role: 'secondary', maxLength: 160 },
      optional(fecha),
      contacto,
    ],
    ...DESIGNED,
  },
  {
    id: 'imagen',
    name: 'Slide de imagen',
    icon: 'image',
    fields: [
      { key: 'imagen', label: 'Imagen', kind: 'image', required: true },
      {
        key: 'tituloInterno',
        label: 'Título interno (no se proyecta)',
        kind: 'text',
        required: false,
        role: 'presenter-only',
        maxLength: 60,
      },
    ],
    // Un flyer ya diseñado se muestra tal cual (RF-40): una sola plantilla.
    templateIds: ['imagen'],
    defaultTemplateId: 'imagen',
  },
] satisfies AnnouncementTypeDef[])

export function getTypeDef(id: string): AnnouncementTypeDef {
  const def = ANNOUNCEMENT_TYPES.find((t) => t.id === id)
  if (!def) throw new Error(`Tipo de anuncio desconocido: ${JSON.stringify(id)}`)
  return def
}
