// "Preparar para presentar sin internet" (RF-55, RF-102): comprueba que todo lo que necesita la
// presentación está en este equipo. Pura: el navegador entra como OfflineEnv (offlineEnv.ts).
import { DEFAULT_FONT_FAMILY } from '../slides/fonts-family'
import type { SlideContext, SlideStatus } from '../slides/templates/contract'
import { displayTitle } from './announcements'
import { logoCandidatesFor } from './ministries'
import type { Announcement, Presentation } from './models'
import { contentIssues, type ContentIssue } from './presentations'

export interface OfflineEnv {
  /** navigator.storage.persist(); sin la API → false. */
  requestPersist(): Promise<boolean>
  /** Hay un Service Worker activo controlando la página: la app abre sin red. */
  appInstalled(): Promise<boolean>
  fontReady(family: string): Promise<boolean>
  /** Un logo precargado está en la caché del Service Worker (data: siempre). */
  assetCached(url: string): Promise<boolean>
  /** Con la nube (P8): descarga las imágenes que faltan antes de comprobar. Si falla, se comprueba igual. */
  downloadMissing?(): Promise<void>
}

export type OfflineIssue =
  | ContentIssue
  | { kind: 'imagen'; announcementId: string; title: string }
  | { kind: 'logo'; ministry: string }
  | { kind: 'fuente' }
  | { kind: 'app' }

/** `persistent` no cuenta para `ready`: si el navegador lo niega, solo se avisa (RF-102). */
export interface OfflineReport {
  ready: boolean
  issues: OfflineIssue[]
  persistent: boolean
}

export interface OfflineInput {
  presentation: Presentation
  byId: ReadonlyMap<string, Announcement>
  ctx: SlideContext
  measured?: ReadonlyMap<string, SlideStatus['status']>
  hasImage: (id: string) => Promise<boolean>
}

const every = async <T>(list: readonly T[], test: (x: T) => Promise<boolean>) => (await Promise.all(list.map(test))).every(Boolean)

function liveAnnouncements({ presentation, byId }: OfflineInput): Announcement[] {
  return presentation.items.flatMap(({ announcementId }) => {
    const a = byId.get(announcementId)
    return a && !a.deletedAt ? [a] : []
  })
}

async function imageIssues(input: OfflineInput): Promise<OfflineIssue[]> {
  const list = await Promise.all(
    liveAnnouncements(input).map(async (a) =>
      (await every(a.imageIds, input.hasImage)) ? [] : [{ kind: 'imagen' as const, announcementId: a.id, title: displayTitle(a) ?? 'Sin título' }],
    ),
  )
  return list.flat()
}

/** Los logos usados: los que vienen con la app (precargados) y, por ministerio, los subidos. */
function usedLogos(input: OfflineInput): { assets: string[]; uploaded: { ministry: string; imageIds: string[] }[] } {
  const ids = new Set(liveAnnouncements(input).flatMap((a) => logoCandidatesFor(a.logo, input.ctx.ministries).map((c) => c.id)))
  const assets: string[] = []
  const uploaded = input.ctx.ministries.map((m) => {
    const imageIds: string[] = []
    for (const { source: s } of m.logos) {
      if (s.kind === 'asset' && ids.has(s.src)) assets.push(s.src)
      else if (s.kind === 'image' && ids.has(s.imageId)) imageIds.push(s.imageId)
    }
    return { ministry: m.name, imageIds }
  })
  return { assets, uploaded }
}

/** Un problema por ministerio cuyo logo subido falta. Un logo precargado que falta es parte de la app. */
async function logoIssues(input: OfflineInput, env: OfflineEnv): Promise<{ issues: OfflineIssue[]; assetsCached: boolean }> {
  const { assets, uploaded } = usedLogos(input)
  const checks = uploaded.map(async ({ ministry, imageIds }) =>
    imageIds.length > 0 && !(await every(imageIds, input.hasImage)) ? [{ kind: 'logo' as const, ministry }] : [],
  )
  const [lists, assetsCached] = await Promise.all([Promise.all(checks), every(assets, env.assetCached)])
  return { issues: lists.flat(), assetsCached }
}

export async function checkOffline(input: OfflineInput, env: OfflineEnv, opts: { persist?: boolean } = {}): Promise<OfflineReport> {
  await env.downloadMissing?.().catch(() => {})
  const [persistent, images, logos, app, font] = await Promise.all([
    opts.persist ? env.requestPersist() : Promise.resolve(true),
    imageIssues(input),
    logoIssues(input, env),
    env.appInstalled(),
    env.fontReady(DEFAULT_FONT_FAMILY),
  ])
  const issues: OfflineIssue[] = [
    ...contentIssues(input.presentation, input.byId, input.measured),
    ...images,
    ...logos.issues,
    ...(app && logos.assetsCached ? [] : [{ kind: 'app' as const }]),
    ...(font ? [] : [{ kind: 'fuente' as const }]),
  ]
  return { ready: issues.length === 0, issues, persistent }
}

export function issueMessage(issue: OfflineIssue): string {
  switch (issue.kind) {
    case 'app':
      return 'La app aún no está guardada en este equipo. Recarga la página con internet y vuelve a comprobar.'
    case 'fuente':
      return 'Falta la letra de las slides en este equipo.'
    case 'imagen':
      return `Falta una imagen de «${issue.title}». Ábrelo y vuelve a subirla.`
    case 'logo':
      return `Falta el logo de ${issue.ministry}.`
    case 'vacia':
      return 'La presentación no tiene anuncios.'
    case 'eliminado':
      return 'Hay un anuncio eliminado en la lista. Quítalo.'
    case 'borrador':
      return `«${issue.title}» está incompleto.`
    case 'no_cabe':
      return `«${issue.title}» no cabe en su slide.`
    case 'midiendo':
      return `Comprobando la slide de «${issue.title}»…`
  }
}
