// Ministerios y sus logos (RF-35, RF-36, RF-38): la iglesia viene precargada y no se guarda en Dexie.
import horizontalBlanco from '../assets/logos/iglesia/iasd-horizontal-blanco.svg'
import horizontalNegro from '../assets/logos/iglesia/iasd-horizontal-negro.svg'
import verticalBlanco from '../assets/logos/iglesia/iasd-vertical-blanco.svg'
import verticalNegro from '../assets/logos/iglesia/iasd-vertical-negro.svg'
import aventureros from '../assets/logos/ministerios/aventureros-color.svg'
import conquistadores from '../assets/logos/ministerios/conquistadores-color.svg'
import escuelaSabatica from '../assets/logos/ministerios/escuela-sabatica-color.svg'
import guiasMayores from '../assets/logos/ministerios/guias-mayores-color.svg'
import jaBlanco from '../assets/logos/ministerios/ja-blanco.svg'
import jaColor from '../assets/logos/ministerios/ja-color.svg'
import jaNegro from '../assets/logos/ministerios/ja-negro.svg'
import mujerColor from '../assets/logos/ministerios/mujer-color.svg'
import mujerIsotipo from '../assets/logos/ministerios/mujer-isotipo.svg'
import type { LogoCandidate } from '../slides/engine'
import type { AppDb } from './local/db'
import type { Announcement, LogoSource, LogoVariant, Ministry } from './models'

/** Máximo de logos por slide (v1.4): hasta dos ministerios y, en casos especiales, tres. */
export const MAX_LOGOS = 3

export const CHURCH_MINISTRY_ID = 'iglesia'

const PRELOADED_AT = '2026-11-01T00:00:00.000Z'

/** Ministerio de la IASD precargado: logos oficiales vectorizados (LICENSES.md). */
const ministry = (id: string, name: string, logos: LogoVariant[]): Ministry => ({ id, updatedAt: PRELOADED_AT, name, isChurch: false, logos })
const asset = (src: string) => ({ kind: 'asset', src }) as const

/** Logo oficial IASD: solo monocromo (negro/blanco), sin variante a color (§13.2-A). */
export const PRELOADED_MINISTRIES: readonly Ministry[] = [
  {
    id: CHURCH_MINISTRY_ID,
    updatedAt: PRELOADED_AT,
    name: 'Iglesia',
    isChurch: true,
    logos: [
      { source: { kind: 'asset', src: horizontalNegro }, color: 'negro', orientation: 'horizontal' },
      { source: { kind: 'asset', src: horizontalBlanco }, color: 'blanco', orientation: 'horizontal' },
      { source: { kind: 'asset', src: verticalNegro }, color: 'negro', orientation: 'vertical' },
      { source: { kind: 'asset', src: verticalBlanco }, color: 'blanco', orientation: 'vertical' },
    ],
  },
  ministry('aventureros', 'Club de Aventureros', [
    { source: asset(aventureros), color: 'color', dominantColor: '#1f5faa', orientation: 'cuadrado' },
  ]),
  ministry('conquistadores', 'Club de Conquistadores', [
    { source: asset(conquistadores), color: 'color', dominantColor: '#e02612', orientation: 'cuadrado' },
  ]),
  ministry('escuela-sabatica', 'Escuela Sabática', [
    { source: asset(escuelaSabatica), color: 'color', dominantColor: '#003a7a', orientation: 'cuadrado' },
  ]),
  ministry('guias-mayores', 'Guías Mayores', [
    { source: asset(guiasMayores), color: 'color', dominantColor: '#0a1f5e', orientation: 'cuadrado' },
  ]),
  ministry('jovenes-adventistas', 'Jóvenes Adventistas', [
    { source: asset(jaColor), color: 'color', dominantColor: '#5a9bd0', orientation: 'horizontal' },
    { source: asset(jaNegro), color: 'negro', orientation: 'horizontal' },
    { source: asset(jaBlanco), color: 'blanco', orientation: 'horizontal' },
  ]),
  ministry('ministerio-mujer', 'Ministerio de la Mujer', [
    { source: asset(mujerColor), color: 'color', dominantColor: '#6b1c77', orientation: 'horizontal' },
    { source: asset(mujerIsotipo), color: 'color', dominantColor: '#661a4c', orientation: 'cuadrado' },
  ]),
]

const PRELOADED_IDS = new Set(PRELOADED_MINISTRIES.map((m) => m.id))

const sourceId = (source: LogoSource) => (source.kind === 'asset' ? source.src : source.imageId)

/** Precargados primero (iglesia a la cabeza); después los ministerios guardados y no borrados, por nombre. */
export async function listMinistries(db: AppDb): Promise<Ministry[]> {
  const stored = await db.ministries.toArray()
  const own = stored
    .filter((m) => !m.deletedAt && !PRELOADED_IDS.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return [...PRELOADED_MINISTRIES, ...own]
}

function toCandidate({ source, ...variant }: LogoVariant): LogoCandidate {
  return { id: sourceId(source), ...variant }
}

const selectedIds = (selection: Announcement['logo']): string[] => {
  switch (selection.kind) {
    case 'ninguno':
      return []
    case 'iglesia':
      return [CHURCH_MINISTRY_ID]
    case 'ministerio':
      return [selection.ministryId]
    case 'varios':
      return [...new Set(selection.ministryIds)].slice(0, MAX_LOGOS)
  }
}

/**
 * Un grupo de candidatos por ministerio elegido (hasta 3), en el orden pedido. Los ministerios
 * borrados o inexistentes no dejan hueco. Con `form: 'isotipo'` quedan solo las variantes
 * `cuadrado` del ministerio que las tenga; con logotipo, las demás. Si no tiene esa forma, todas.
 */
export function logoGroupFor(selection: Announcement['logo'], ministries: readonly Ministry[]): LogoCandidate[][] {
  const form = selection.kind === 'ninguno' ? undefined : selection.form
  return selectedIds(selection).flatMap((id) => {
    const ministry = ministries.find((m) => m.id === id && !m.deletedAt)
    if (!ministry || ministry.logos.length === 0) return []
    const all = ministry.logos.map(toCandidate)
    const wanted = form === undefined ? all : all.filter((c) => (c.orientation === 'cuadrado') === (form === 'isotipo'))
    return [wanted.length > 0 ? wanted : all]
  })
}

/** Logos que el motor puede elegir para la selección del anuncio (todos los grupos juntos); `[]` si no hay. */
export function logoCandidatesFor(selection: Announcement['logo'], ministries: readonly Ministry[]): LogoCandidate[] {
  return logoGroupFor(selection, ministries).flat()
}

/** Fuente del logo que eligió el motor (por el id del candidato). */
export function logoUrlFor(candidateId: string, ministries: readonly Ministry[]): LogoSource | undefined {
  for (const m of ministries) {
    const logo = m.logos.find((l) => sourceId(l.source) === candidateId)
    if (logo) return logo.source
  }
  return undefined
}
