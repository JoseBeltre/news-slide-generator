// Tema de la interfaz: el del sistema (por defecto), claro u oscuro. Se guarda en este navegador
// y se aplica como data-theme en <html>; los tokens de styles.css hacen el resto. No toca las slides.
import { readonly, ref } from 'vue'

export type ThemeMode = 'sistema' | 'claro' | 'oscuro'
export const THEME_STORAGE_KEY = 'tema'
const ATTR: Record<ThemeMode, 'light' | 'dark' | undefined> = { sistema: undefined, claro: 'light', oscuro: 'dark' }

function saved(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'claro' || v === 'oscuro' ? v : 'sistema'
  } catch {
    return 'sistema'
  }
}

function apply(mode: ThemeMode) {
  const attr = ATTR[mode]
  if (attr) document.documentElement.dataset.theme = attr
  else delete document.documentElement.dataset.theme
}

const mode = ref<ThemeMode>(saved())

/** Antes de montar la app, para no ver un destello del otro tema. */
export function applySavedTheme() {
  mode.value = saved()
  apply(mode.value)
}

export function useTheme() {
  function set(next: ThemeMode) {
    mode.value = next
    apply(next)
    try {
      if (next === 'sistema') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento (modo privado): el tema dura hasta recargar.
    }
  }
  return { mode: readonly(mode), set }
}
