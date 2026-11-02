// Una línea por tipo en el paso 1 (RF-01): qué se anuncia con él.
import type { AnnouncementTypeId } from '../../../slides/types/fields'

export const TYPE_DESCRIPTIONS: Readonly<Record<AnnouncementTypeId, string>> = Object.freeze({
  culto: 'Culto o programa especial, con predicador o invitado y su foto.',
  salida: 'Excursión: salida, destino, qué llevar y fecha límite.',
  obra_misionera: 'Evangelismo o visita misionera: zona, fecha y hora.',
  cumpleanos: 'Uno o varios cumpleañeros, con foto opcional.',
  actividad: 'Cualquier actividad con fecha, hora y lugar.',
  aviso: 'Un mensaje corto, con o sin fecha.',
  imagen: 'Un flyer ya diseñado, proyectado tal cual.',
})
