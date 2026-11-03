// Reglas para presentar (RF-62…RF-64), puras: el estado que proyecta la ventana pública, los
// comandos que lo cambian, las teclas del teclado o el clicker y los puntos clave del presentador.
import { getTypeDef } from '../slides/types/definitions'
import { displayTitle } from './announcements'
import type { Announcement } from './models'
import type { PresentationSlide } from './presentations'

export interface PresenterState {
  index: number
  black: boolean
  logo: boolean
}

export const INITIAL_STATE: PresenterState = Object.freeze({ index: 0, black: false, logo: false })

export type Command =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'goto'; index: number }
  | { type: 'black' }
  | { type: 'logo' }
  | { type: 'exit' }

const clamp = (index: number, total: number) => Math.min(Math.max(0, index), Math.max(0, total - 1))

/** Moverse quita el negro y el logo; negro y logo alternan y se excluyen. `exit` no cambia nada. */
export function apply(state: PresenterState, command: Command, total: number): PresenterState {
  const go = (index: number) => ({ index: clamp(index, total), black: false, logo: false })
  switch (command.type) {
    case 'next':
      return go(state.index + 1)
    case 'prev':
      return go(state.index - 1)
    case 'first':
      return go(0)
    case 'last':
      return go(total - 1)
    case 'goto':
      return go(command.index)
    case 'black':
      return { ...state, black: !state.black, logo: false }
    case 'logo':
      return { ...state, logo: !state.logo, black: false }
    case 'exit':
      return state
  }
}

const KEYS: Record<string, Command> = {
  ArrowRight: { type: 'next' },
  ArrowDown: { type: 'next' },
  ' ': { type: 'next' },
  PageDown: { type: 'next' },
  ArrowLeft: { type: 'prev' },
  ArrowUp: { type: 'prev' },
  PageUp: { type: 'prev' },
  Home: { type: 'first' },
  End: { type: 'last' },
  b: { type: 'black' },
  l: { type: 'logo' },
  Escape: { type: 'exit' },
}

/** La tecla como comando (RF-64). Con Ctrl/Alt/Meta, o escribiendo en un campo (salvo Esc), nada. */
export function commandForKey(
  e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey'>,
  inField: boolean,
): Command | undefined {
  if (e.ctrlKey || e.altKey || e.metaKey) return undefined
  const command = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key]
  if (!command || (inField && command.type !== 'exit')) return undefined
  return command
}

/** Lo que el presentador lee de la slide actual (RF-63). `label` dice qué es; `lines`, los datos clave. */
export interface KeyPoints {
  heading: string
  label: string
  lines: string[]
  notes?: string
}

function withNotes(points: KeyPoints, a: Announcement | undefined): KeyPoints {
  const notes = a?.presenterNotes?.trim()
  return notes ? { ...points, notes } : points
}

export function keyPoints(slide: PresentationSlide | undefined, byId: ReadonlyMap<string, Announcement>): KeyPoints {
  if (!slide) return { heading: 'Sin slides', label: '', lines: [] }
  const a = slide.announcementId ? byId.get(slide.announcementId) : undefined
  const typeName = a ? getTypeDef(a.typeId).name : ''
  const { spec } = slide
  switch (spec.kind) {
    case 'cover':
      return { heading: 'Portada', label: 'Portada', lines: [] }
    case 'closing':
      return { heading: 'Cierre', label: 'Cierre', lines: [] }
    case 'announcement': {
      const lines = spec.data.rows.filter((r) => r.role === 'key').map((r) => r.text)
      return withNotes({ heading: spec.data.title?.text ?? (a && displayTitle(a)) ?? typeName, label: typeName, lines }, a)
    }
    case 'birthday-single':
      return withNotes({ heading: spec.person.name, label: typeName, lines: spec.dayText ? [spec.dayText] : [] }, a)
    case 'birthday-group': {
      const label = spec.page ? `${typeName} (${spec.page[0]}/${spec.page[1]})` : typeName
      return withNotes({ heading: 'Cumpleaños', label, lines: spec.people.map((p) => p.name) }, a)
    }
    case 'image':
      return withNotes({ heading: (a && displayTitle(a)) ?? 'Imagen', label: typeName, lines: [] }, a)
  }
}
