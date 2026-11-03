// La ventana pública (RF-65, RF-67): abrirla, saber si se cerró y reabrirla. Si el navegador deja
// usar la Window Management API, se abre directo en la otra pantalla; si no (Brave puede negarla),
// se abre normal y el presentador sigue las instrucciones en pantalla, que es el flujo principal.
import { inject, onBeforeUnmount, readonly, ref, type InjectionKey, type Ref } from 'vue'

type Opener = (url: string, target: string, features: string) => Window | null

/** Para las pruebas: otra forma de abrir ventanas (provide). */
export const PUBLIC_WINDOW_OPENER: InjectionKey<Opener> = Symbol('PublicWindowOpener')

const TARGET = 'pantalla-publica'

interface ScreenLike {
  isPrimary?: boolean
  availLeft: number
  availTop: number
  availWidth: number
  availHeight: number
}

/** Posición de una pantalla que no es la de esta ventana, si el navegador lo permite. */
async function otherScreen(): Promise<string | undefined> {
  const w = window as Window & { getScreenDetails?: () => Promise<{ screens: ScreenLike[]; currentScreen: ScreenLike }> }
  if (!w.getScreenDetails) return undefined
  try {
    const details = await w.getScreenDetails()
    const s = details.screens.find((x) => x !== details.currentScreen)
    return s ? `left=${s.availLeft},top=${s.availTop},width=${s.availWidth},height=${s.availHeight}` : undefined
  } catch {
    return undefined
  }
}

export function usePublicWindow(url: Ref<string>) {
  const opener = inject(PUBLIC_WINDOW_OPENER, undefined) ?? ((u, t, f) => window.open(u, t, f))
  const handle = ref<Window | null>(null)
  const isOpen = ref(false)
  const timer = setInterval(() => (isOpen.value = !!handle.value && !handle.value.closed), 1000)
  onBeforeUnmount(() => clearInterval(timer))

  async function open() {
    const position = await otherScreen()
    handle.value = opener(url.value, TARGET, position ? `popup,${position}` : 'popup')
    isOpen.value = !!handle.value
  }

  function close() {
    handle.value?.close()
    isOpen.value = false
  }

  return { isOpen: readonly(isOpen), open, close }
}
