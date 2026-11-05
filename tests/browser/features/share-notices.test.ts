// "Compartir los anuncios" en Inicio (P9, RF-72): una línea discreta que comparte o copia el enlace de la
// página pública, y "Ver" para abrirla. Solo con la nube activa.
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { syncPlugin, type SyncContext } from '../../../src/data/sync/useSync'
import ShareNoticesButton from '../../../src/features/home/ShareNoticesButton.vue'
import { byLabel, cleanupDbs, mountApp, testDb, until } from '../helpers/app'
import { cleanupMounted } from '../helpers/mount'

const URL_PUBLICA = `${location.origin}/anuncios/publico`
const wrappers: { unmount: () => void }[] = []

afterEach(async () => {
  for (const w of wrappers.splice(0)) w.unmount()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  cleanupMounted()
  await cleanupDbs()
})

/** Un navigator falso con solo lo que se usa (share y clipboard son getters en el real). */
const fakeNavigator = (props: { share?: unknown; clipboard?: unknown }) =>
  Object.defineProperties(Object.create(navigator), {
    share: { value: props.share, configurable: true },
    clipboard: { value: props.clipboard, configurable: true },
  })

function withCloud() {
  const w = mount(ShareNoticesButton, { attachTo: document.body, global: { plugins: [syncPlugin(shallowRef({} as SyncContext))] } })
  wrappers.push(w)
  return w.element.parentElement as HTMLElement
}

describe('Compartir los anuncios', () => {
  it('sin nube no hay botón', async () => {
    const { host } = await mountApp('/', testDb())
    await until(() => !!host.textContent?.includes('Próximos anuncios'))
    expect(byLabel(host, 'Compartir los anuncios')).toBeUndefined()
  })

  it('con nube y share: llama a share con la URL pública', async () => {
    const share = vi.fn(async () => {})
    vi.stubGlobal('navigator', fakeNavigator({ share }))
    const host = withCloud()
    byLabel(host, 'Compartir los anuncios')!.click()
    await until(() => share.mock.calls.length === 1)
    expect(share).toHaveBeenCalledWith({ title: 'Anuncios · Mansedumbre II', url: URL_PUBLICA })
  })

  it('si se cancela el menú de compartir no pasa nada', async () => {
    const share = vi.fn(async () => {
      throw new DOMException('cancelado', 'AbortError')
    })
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', fakeNavigator({ share, clipboard: { writeText } }))
    const host = withCloud()
    byLabel(host, 'Compartir los anuncios')!.click()
    await until(() => share.mock.calls.length === 1)
    await new Promise((r) => setTimeout(r, 50))
    expect(writeText).not.toHaveBeenCalled()
    expect(host.textContent).not.toContain('Enlace copiado')
  })

  it('sin share: copia y dice Enlace copiado', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', fakeNavigator({ clipboard: { writeText } }))
    const host = withCloud()
    byLabel(host, 'Compartir los anuncios')!.click()
    await until(() => !!host.querySelector('[role="status"]')?.textContent?.includes('Enlace copiado'))
    expect(writeText).toHaveBeenCalledWith(URL_PUBLICA)
  })

  it('sin share ni portapapeles: muestra el enlace para copiarlo a mano', async () => {
    vi.stubGlobal('navigator', fakeNavigator({ clipboard: { writeText: async () => Promise.reject(new Error('no')) } }))
    const host = withCloud()
    byLabel(host, 'Compartir los anuncios')!.click()
    await until(() => !!host.textContent?.includes(URL_PUBLICA))
  })

  it('el enlace Ver abre /anuncios/publico en otra pestaña', () => {
    const host = withCloud()
    const ver = byLabel(host, 'Ver') as HTMLAnchorElement
    expect(ver.getAttribute('href')).toBe('/anuncios/publico')
    expect(ver.target).toBe('_blank')
    expect(ver.rel).toContain('noopener')
  })
})
