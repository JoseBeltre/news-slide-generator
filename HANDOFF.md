# HANDOFF — Anuncios del Sábado

> **Regla de trabajo:** lee este archivo **antes de cada tarea** (si no está ya en el contexto: sesión nueva, después de un compact o en un subagente) y **actualízalo al terminar cada tarea**, en el mismo commit que la tarea. Es la memoria compartida entre sesiones y agentes.

## Estado actual

- **Fase:** 1 (MVP), pasos 1–7 en modo **solo local** (sin backend), según SRS §11.
- **Plan vigente:** `docs/superpowers/plans/2026-11-01-fase1-p1-base-y-motor.md` (pasos 1–2).
- **Hoja de ruta de la fase:** `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md` (pasos 1–7).
- **Aprobación:** P1 aprobado el 2026-11-01; ejecución **nativa** (inline, una revisión final de toda la rama).
- **Rama:** `fase1/p1-base-y-motor`.
- **Ledger de ejecución:** `.superpowers/sdd/2026-11-01-fase1-p1-base-y-motor/progress.md` (ignorado por git).
- **Hecho:** **P1 completo** (Tareas 1–10) y revisado: revisión final de toda la rama hecha y sus 2 hallazgos importantes corregidos. Pendiente: decidir el merge a `master`.

### API del motor (`src/slides/engine/index.ts`)

| Módulo | Qué ofrece |
|---|---|
| `canvas` | `CANVAS` (1920×1080), `SAFE_AREA`, `computeScale`, `isInsideSafeArea` |
| `SlideCanvas.vue` | Lienzo escalado; prop `fontFamily` (token), variable `--slide-font-family` |
| `color` | `parseColor`, `toHex`, `contrastRatio`, `minContrastAgainst`, `pickTextColor`, `ensureContrast` (≥ 7:1 ajustando el fondo), `ensureGradientContrast` (un texto ≥ 7:1 contra todas las paradas; **usarlo en P3 para todo degradado**) |
| `readability` | `TEXT_ROLES` (§5.3), constantes de §5, `resolveFontRange`, `validateTextSlot`, `checkDensity`, `countWords` |
| `fit` / `measure` | `findLargestFittingSize`; `ensureFontLoaded`, `measureTextFit`, `normalizeSlotText` |
| `FitText.vue` / `fitReport` | Texto ajustado que emite `FitReport`; `summarizeFit` → `ok` / `no_cabe` con campos culpables |
| `logo` | `selectLogoVariant` (placa si nada contrasta ≥ 3:1), `clampLogoHeight` |
| `audit` | `auditSlide(canvasEl)`: verificación §5.7. **Contrato de marcado** para plantillas: `data-role`, `data-logo`/`data-cover`, `data-icon`, `data-bg="#hex,…"` en degradados |

## Próxima tarea

- Decidir el merge de `fase1/p1-base-y-motor` a `master`; luego escribir el plan detallado de **P2** (tipos, datos locales y logos).

## Decisiones tomadas

| Fecha | Decisión | Fuente |
|---|---|---|
| 2026-11-01 | §13.1 confirmado por el responsable (modo extendido, Windows + Chrome/Brave, logos, cumpleaños, cuentas, vista pública, Hostinger FTP, MIT). | SRS v1.3 §13.1 |
| 2026-11-01 | §13.2-A (logos de la iglesia): **no bloquea**; se usa un **logo de prueba** en SVG (variantes color/blanco/negro) hasta recibir los archivos reales. | SRS §13.2 |
| 2026-11-01 | §13.2-B: mínimos de §5 tal cual (pensados para ~12–15 m). §13.2-C y D no afectan a los pasos 1–7. | SRS §13.2 |
| 2026-11-01 | Pruebas que miden texto (ajuste, auditoría) corren en **Vitest browser mode con Chromium** (jsdom no calcula layout). La lógica pura corre en el proyecto `unit`. | Plan P1 |
| 2026-11-01 | Identificadores de código en inglés; textos de interfaz y valores de enumeraciones del modelo (§7) en español. | Plan P1 |
| 2026-11-01 | Versiones instaladas más nuevas que las del plan: **Vite 8, Vitest 5, TypeScript 6, Vue 3.5, Playwright 1.64**. La API de browser mode (`playwright()` + `test.projects`) es la misma que en Vitest 4. | Tarea 1 |
| 2026-11-01 | Un solo `tsconfig.json` (DOM + tipos de Node) en lugar de `tsconfig.app/node`: `vue-tsc --noEmit` no revisa proyectos referenciados. | Tarea 1 |
| 2026-11-01 | `globPatterns` de Workbox **sin** `webmanifest`: el plugin ya lo precachea y duplicarlo hace que el SW se instale vacío (`add-to-cache-list-conflicting-entries`) sin error visible. Si se toca `globPatterns`, correr `npm run test:e2e`. | Tarea 2 |
| 2026-11-01 | `registerType: 'prompt'`: una versión nueva nunca recarga la página en medio de una presentación. El aviso "nueva versión" llega en P4. | Tarea 2 |
| 2026-11-01 | La E2E de fuente offline usa `document.fonts.load()` (fuerza la descarga desde el precache); `check()` no carga nada. | Tarea 2 |
| 2026-11-01 | `FitText`: si la fuente no carga, no dibuja nada ni emite informe (y lo registra en consola); nunca mide con la fuente de respaldo. Si llega un texto nuevo mientras carga la fuente, se descarta la medición vieja. | Tarea 8 |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite). |
| `npm run build` | Typecheck + build de producción en `dist/`. |
| `npm run preview` | Sirve `dist/` en `http://localhost:4173`. |
| `npm run typecheck` | `vue-tsc --noEmit`. |
| `npm test` | Vitest: proyectos `unit` (Node) y `browser` (Chromium). |
| `npm run test:unit` / `npm run test:browser` | Un solo proyecto de Vitest. |
| `npm run test:e2e` | Playwright contra el build: hace `build` + `preview` en el puerto 4173 (reutiliza un servidor ya abierto ahí; ciérralo si el build cambió). |

Requisito de una sola vez: `npx playwright install chromium`.

## Problemas abiertos / bloqueos

Hallazgos menores de la revisión final de P1, pendientes de programar (sobre todo antes o durante P3):
- `FitText`: si falla la fuente, la slide informa "ok" sin texto → añadir un estado `error` visible (P3/P4).
- `FitText`: al cambiar el texto se dibuja un instante al tamaño anterior; un slot inválido lanza un error asíncrono sin informe. Llamar a `validateTextSlot` en el registro de plantillas (P3).
- `measure` y `FitText` no fijan `letter-spacing`, `word-spacing`, `font-kerning` ni `font-feature-settings`: si un tema los cambia, lo medido y lo dibujado divergen.
- `auditSlide` devuelve `[]` con un lienzo de tamaño 0 (debería fallar) y se rompe con colores `oklch()`/`color()`; ignora la transparencia.
- Un campo con solo un espacio de ancho cero (U+200B) cuenta como contenido.
- `npm audit`: 5 avisos *moderate* en dependencias de desarrollo (cadena de `editorconfig`, vía herramientas de Vue). No llegan al navegador; revisar al actualizar dependencias.

## Registro de tareas

| Fecha | Tarea | Resultado | Commit |
|---|---|---|---|
| 2026-11-01 | Lectura del SRS v1.3 y redacción de los planes | Planes escritos y aprobados | ver `git log` (docs) |
| 2026-11-01 | P1 · T1: montar Vite + Vue + TS estricto + Vitest unit/browser | typecheck OK; `npm test` 2/2 | 812ae6d |
| 2026-11-01 | P1 · T2: PWA offline, `.htaccess`, E2E sin red | `npm test` 5/5; `test:e2e` 2/2 | 4d86e46 |
| 2026-11-01 | P1 · T3: lienzo, área segura, `SlideCanvas.vue` | `npm test` 22/22 | e43e3b6 |
| 2026-11-01 | P1 · T4: color y contraste WCAG, `ensureContrast` | `npm test` 51/51 | b13d680 |
| 2026-11-01 | P1 · T5: reglas de legibilidad, `TextSlotDef`, `validateTextSlot` | `npm test` 63/63 | dc47cb1 |
| 2026-11-01 | P1 · T6: `findLargestFittingSize` | `npm test` 74/74 | 73eb5b2 |
| 2026-11-01 | P1 · T7: `measureTextFit`, `ensureFontLoaded` (sin cortes a mitad de palabra; verificado con mutación) | `npm test` 92/92 | ca52344 |
| 2026-11-01 | P1 · T8: `FitText.vue`, `summarizeFit`; helper de pruebas `tests/browser/helpers/mount.ts` | `npm test` 101/101 | 8d6d591 |
| 2026-11-01 | P1 · T9: `selectLogoVariant` con placa, `clampLogoHeight` | `npm test` 112/112 | 2a45c46 |
| 2026-11-01 | P1 · T10: `auditSlide`, `index.ts`, verificación completa | typecheck 0 errores; `npm test` 126/126; `test:e2e` 2/2; build OK | b4ca2ad |
| 2026-11-01 | P1 · revisión final: `ensureGradientContrast`; `ensureFontLoaded` carga también Latin Extended | `npm test` 136/136; `test:e2e` 2/2 | ver `git log` |
