// Ministerios y sus logos (RF-35, RF-36, RF-38): la iglesia viene precargada y no se guarda en Dexie.
import horizontalBlanco from '../assets/logos/iglesia/iasd-horizontal-blanco.svg'
import horizontalNegro from '../assets/logos/iglesia/iasd-horizontal-negro.svg'
import verticalBlanco from '../assets/logos/iglesia/iasd-vertical-blanco.svg'
import verticalNegro from '../assets/logos/iglesia/iasd-vertical-negro.svg'
import type { LogoCandidate } from '../slides/engine'
import type { AppDb } from './local/db'
import type { Announcement, LogoSource, LogoVariant, Ministry } from './models'

export const CHURCH_MINISTRY_ID = 'iglesia'

/** Logo oficial IASD: solo monocromo (negro/blanco), sin variante a color (§13.2-A). */
export const PRELOADED_MINISTRIES: readonly Ministry[] = [
  {
    id: CHURCH_MINISTRY_ID,
    updatedAt: '2026-11-01T00:00:00.000Z',
    name: 'Iglesia',
    isChurch: true,
    logos: [
      { source: { kind: 'asset', src: horizontalNegro }, color: 'negro', orientation: 'horizontal' },
      { source: { kind: 'asset', src: horizontalBlanco }, color: 'blanco', orientation: 'horizontal' },
      { source: { kind: 'asset', src: verticalNegro }, color: 'negro', orientation: 'vertical' },
      { source: { kind: 'asset', src: verticalBlanco }, color: 'blanco', orientation: 'vertical' },
    ],
  },
]

const sourceId = (source: LogoSource) => (source.kind === 'asset' ? source.src : source.imageId)

/** Iglesia primero; después los ministerios guardados y no borrados, por nombre. */
export async function listMinistries(db: AppDb): Promise<Ministry[]> {
  const stored = await db.ministries.toArray()
  const own = stored
    .filter((m) => !m.deletedAt && m.id !== CHURCH_MINISTRY_ID)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return [...PRELOADED_MINISTRIES, ...own]
}

function toCandidate({ source, ...variant }: LogoVariant): LogoCandidate {
  return { id: sourceId(source), ...variant }
}

/** Logos que el motor puede elegir para la selección del anuncio; `[]` si no hay o el ministerio ya no existe. */
export function logoCandidatesFor(selection: Announcement['logo'], ministries: readonly Ministry[]): LogoCandidate[] {
  if (selection.kind === 'ninguno') return []
  const id = selection.kind === 'iglesia' ? CHURCH_MINISTRY_ID : selection.ministryId
  const ministry = ministries.find((m) => m.id === id && !m.deletedAt)
  return ministry ? ministry.logos.map(toCandidate) : []
}

/** Fuente del logo que eligió el motor (por el id del candidato). */
export function logoUrlFor(candidateId: string, ministries: readonly Ministry[]): LogoSource | undefined {
  for (const m of ministries) {
    const logo = m.logos.find((l) => sourceId(l.source) === candidateId)
    if (logo) return logo.source
  }
  return undefined
}
