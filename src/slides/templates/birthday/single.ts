// Columna de texto del cumpleaños individual, común a los 3 estilos: el mensaje arriba, el nombre
// como protagonista y, abajo, el día (si no va en el bloque de fecha) y el versículo tras un ornamento.
import type { TextSlotDef } from '../../engine'

export interface SingleSlots {
  message: TextSlotDef
  name: TextSlotDef
  day?: TextSlotDef
  verse?: TextSlotDef
  /** Arriba del ornamento o filete entre el nombre y el versículo. */
  ornamentY?: number
}

export interface SingleOptions {
  top: number
  bottom: number
  /** Alto de la caja del mensaje: con valign bottom, queda pegado al nombre. */
  messageHeight?: number
  /** El día del cumpleaños como línea propia ("7 de noviembre"), cuando la foto ocupa el bloque de fecha. */
  withDayLine: boolean
  withVerse: boolean
  /** Alto de la franja del ornamento entre el nombre y el versículo. */
  ornament: number
  align?: 'left' | 'center' | 'right'
}

const VERSE_HEIGHT = 200
const DAY_HEIGHT = 92
const MESSAGE_HEIGHT = 168

export function singleSlots(column: { x: number; width: number }, o: SingleOptions): SingleSlots {
  const at = (y: number, height: number) => ({ ...column, y, height })
  const align = o.align ? { align: o.align } : {}
  const messageHeight = o.messageHeight ?? MESSAGE_HEIGHT
  const verseTop = o.bottom - VERSE_HEIGHT
  const bandTop = o.withVerse ? verseTop - o.ornament : o.bottom
  const dayTop = bandTop - DAY_HEIGHT - 8
  const nameTop = o.top + messageHeight + 20
  const nameBottom = o.withDayLine ? dayTop - 12 : bandTop
  return {
    message: { id: 'mensaje', role: 'key', fieldKey: 'mensaje', box: at(o.top, messageHeight), maxLines: 2, maxFontSize: 76, valign: 'bottom', ...align },
    name: {
      id: 'nombre',
      role: 'birthdayNameSingle',
      fieldKey: 'personas',
      box: at(nameTop, nameBottom - nameTop),
      maxLines: 2,
      maxFontSize: 230,
      valign: o.withDayLine || o.withVerse ? 'bottom' : 'center',
      ...align,
    },
    ...(o.withDayLine ? { day: { id: 'dia', role: 'key', fieldKey: 'personas', box: at(dayTop, DAY_HEIGHT), maxLines: 1, maxFontSize: 76, ...align } } : {}),
    ...(o.withVerse
      ? {
          verse: { id: 'versiculo', role: 'secondary', fieldKey: 'versiculo', box: at(verseTop, VERSE_HEIGHT), maxLines: 4, maxFontSize: 52, valign: 'top', ...align },
          ornamentY: bandTop + (o.ornament - 44) / 2,
        }
      : {}),
  } satisfies SingleSlots
}
