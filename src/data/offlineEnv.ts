// El navegador real para la comprobación sin internet (offline.ts). Ninguna API ausente lanza:
// responde false y la comprobación dice qué falta.
import type { OfflineEnv } from './offline'

async function safely(run: () => Promise<boolean>): Promise<boolean> {
  try {
    return await run()
  } catch {
    return false
  }
}

export function browserOfflineEnv(): OfflineEnv {
  return {
    requestPersist: () => safely(async () => (navigator.storage?.persist ? navigator.storage.persist() : false)),
    appInstalled: () => safely(async () => Boolean(navigator.serviceWorker?.controller)),
    fontReady: (family) =>
      safely(async () => {
        const spec = `1em "${family}"`
        await document.fonts.load(spec)
        return document.fonts.check(spec)
      }),
    assetCached: (url) =>
      safely(async () => url.startsWith('data:') || (typeof caches !== 'undefined' && (await caches.match(url)) !== undefined)),
  }
}
