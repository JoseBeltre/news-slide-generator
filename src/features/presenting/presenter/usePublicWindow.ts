// La ventana pública (RF-65, RF-67): abrirla, saber si se cerró y reabrirla. Si el navegador deja
// usar la Window Management API, se mueve a la otra pantalla; si no (Brave puede negarla), queda
// donde abrió y el presentador sigue las instrucciones en pantalla, que es el flujo principal.
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

/** Una pantalla que no es la de esta ventana, si el navegador lo permite. */
async function otherScreen(): Promise<ScreenLike | undefined> {
  const w = window as Window & { getScreenDetails?: () => Promise<{ screens: ScreenLike[]; currentScreen: ScreenLike }> }
  if (!w.getScreenDetails) return undefined
  try {
    const details = await w.getScreenDetails()
    return details.screens.find((x) => x !== details.currentScreen)
  } catch {
    return undefined
  }
}

export function usePublicWindow(url: Ref<string>) {
  const opener = inject(PUBLIC_WINDOW_OPENER, undefined) ?? ((u, t, f) => window.open(u, t, f))
  const handle = ref<Window | null>(null)
  const isOpen = ref(false)
  /** El navegador no dejó abrir la ventana (ventanas emergentes bloqueadas). */
  const blocked = ref(false)
  const timer = setInterval(() => (isOpen.value = !!handle.value && !handle.value.closed), 1000)
  onBeforeUnmount(() => clearInterval(timer))

  /** Se abre en el mismo clic (si no, el navegador la bloquea) y después se mueve a la otra pantalla. */
  async function open() {
    handle.value = opener(url.value, TARGET, 'popup')
    blocked.value = !handle.value
    isOpen.value = !!handle.value
    const s = handle.value && (await otherScreen())
    if (!s || !handle.value) return
    try {
      handle.value.moveTo(s.availLeft, s.availTop)
      handle.value.resizeTo(s.availWidth, s.availHeight)
    } catch {
      // No se pudo mover: el presentador la arrastra, como dicen las instrucciones.
    }
  }

  function close() {
    handle.value?.close()
    isOpen.value = false
  }

  return { isOpen: readonly(isOpen), blocked: readonly(blocked), open, close }
}
