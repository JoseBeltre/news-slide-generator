// Ayudas compartidas por las pruebas E2E (build de vista previa con Service Worker).
import type { BrowserContext, Page } from '@playwright/test'

export const isoInDays = (n: number, from = new Date()) => {
  const d = new Date(from)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** El próximo sábado (hoy si es sábado), como la app. */
export const nextSaturdayIso = () => isoInDays((6 - new Date().getDay() + 7) % 7)

/** Carga una vez con red, deja la página controlada por el Service Worker y corta la red. */
export async function goOffline(page: Page, context: BrowserContext) {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
}

/** Abre el menú de tres puntos de la fila de un anuncio y elige una acción (Duplicar, Exportar, Eliminar…). */
export async function rowAction(page: Page, title: string, action: string) {
  await page.getByRole('button', { name: `Acciones de «${title}»` }).first().click()
  await page.getByRole('menuitem', { name: action }).click()
}
