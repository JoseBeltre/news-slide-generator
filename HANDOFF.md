# HANDOFF — Anuncios del Sábado

> **Regla de trabajo:** lee este archivo **antes de cada tarea** (si no está ya en el contexto: sesión nueva, después de un compact o en un subagente) y **actualízalo al terminar cada tarea**, en el mismo commit que la tarea. Es la memoria compartida entre sesiones y agentes.

## Estado actual

- **Fase:** 1 (MVP), pasos 1–7 en modo **solo local** (sin backend), según SRS §11.
- **Plan vigente:** `docs/superpowers/plans/2026-11-01-fase1-p2-tipos-datos-logos.md` (paso 3), aprobado; ejecución **nativa** en la rama `fase1/p2-tipos-datos-logos`. Ledger: `.superpowers/sdd/2026-11-01-fase1-p2-tipos-datos-logos/progress.md`. P1 está terminado y unido a `master`.
- **P2 hecho:** Tareas 1–2 (formato es-DO; definiciones declarativas de los 7 tipos).
- **Hoja de ruta de la fase:** `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md` (pasos 1–7).
- **Aprobación:** P1 aprobado el 2026-11-01; ejecución **nativa** (inline, una revisión final de toda la rama).
- **Rama:** `fase1/p1-base-y-motor`.
- **Ledger de ejecución:** `.superpowers/sdd/2026-11-01-fase1-p1-base-y-motor/progress.md` (ignorado por git).
- **Hecho:** **P1 completo**, revisado y unido a `master` (fast-forward; rama borrada). Verificado en `master`: typecheck 0 errores, `pnpm test` 136/136, `pnpm test:e2e` 2/2.

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

- P2 · Tarea 3: validación de valores con Zod (`src/slides/types/validation.ts`).

## Decisiones tomadas

| Fecha | Decisión | Fuente |
|---|---|---|
| 2026-11-01 | §13.1 confirmado por el responsable (modo extendido, Windows + Chrome/Brave, logos, cumpleaños, cuentas, vista pública, Hostinger FTP, MIT). | SRS v1.3 §13.1 |
| 2026-11-01 | §13.2-A (logos de la iglesia): **recibido el logo principal IASD** (4 SVG: lateral/centrado × negro `#12100b`/blanco), copiados a `src/assets/logos/iglesia/iasd-{horizontal,vertical}-{negro,blanco}.svg`. Monocromo, sin variante a color. Solo trazados: funciona sin red. **Falta el isotipo** (irá como variantes `cuadrado`). | Responsable |
| 2026-11-01 | §13.2-B: mínimos de §5 tal cual (pensados para ~12–15 m). §13.2-C y D no afectan a los pasos 1–7. | SRS §13.2 |
| 2026-11-01 | Pruebas que miden texto (ajuste, auditoría) corren en **Vitest browser mode con Chromium** (jsdom no calcula layout). La lógica pura corre en el proyecto `unit`. | Plan P1 |
| 2026-11-01 | Identificadores de código en inglés; textos de interfaz y valores de enumeraciones del modelo (§7) en español. | Plan P1 |
| 2026-11-01 | Versiones instaladas más nuevas que las del plan: **Vite 8, Vitest 5, TypeScript 6, Vue 3.5, Playwright 1.64**. La API de browser mode (`playwright()` + `test.projects`) es la misma que en Vitest 4. | Tarea 1 |
| 2026-11-01 | Un solo `tsconfig.json` (DOM + tipos de Node) en lugar de `tsconfig.app/node`: `vue-tsc --noEmit` no revisa proyectos referenciados. | Tarea 1 |
| 2026-11-01 | `globPatterns` de Workbox **sin** `webmanifest`: el plugin ya lo precachea y duplicarlo hace que el SW se instale vacío (`add-to-cache-list-conflicting-entries`) sin error visible. Si se toca `globPatterns`, correr `npm run test:e2e`. | Tarea 2 |
| 2026-11-01 | `registerType: 'prompt'`: una versión nueva nunca recarga la página en medio de una presentación. El aviso "nueva versión" llega en P4. | Tarea 2 |
| 2026-11-01 | La E2E de fuente offline usa `document.fonts.load()` (fuerza la descarga desde el precache); `check()` no carga nada. | Tarea 2 |
| 2026-11-01 | Modelo de tipos: añadidos sobre §7 el kind `choice` (+ `options`) y `defaultValue`; el kind `ministry` no se usa (el logo es `Announcement.logo`). Todos los tipos usan plantillas `clasica`/`visual`, salvo `imagen` → `imagen`. Claves de campo en español sin tildes. | P2 · T2 |
| 2026-11-01 | Gestor de paquetes: **pnpm** en lugar de npm (pedido por el responsable). Migrado con `pnpm import`, conservando las versiones exactas; `engines.node >= 24`. | Responsable |
| 2026-11-01 | `FitText`: si la fuente no carga, no dibuja nada ni emite informe (y lo registra en consola); nunca mide con la fuente de respaldo. Si llega un texto nuevo mientras carga la fuente, se descarta la medición vieja. | Tarea 8 |

## Comandos

Gestor de paquetes: **pnpm** (fijado en `package.json` → `packageManager: pnpm@11.20.0`). No usar npm ni yarn: el lockfile es `pnpm-lock.yaml`.

| Comando | Qué hace |
|---|---|
| `pnpm install` | Instala dependencias. |
| `pnpm dev` | Servidor de desarrollo (Vite). |
| `pnpm build` | Typecheck + build de producción en `dist/`. |
| `pnpm preview` | Sirve `dist/` en `http://localhost:4173`. |
| `pnpm typecheck` | `vue-tsc --noEmit`. |
| `pnpm test` | Vitest: proyectos `unit` (Node) y `browser` (Chromium). |
| `pnpm test:unit` / `pnpm test:browser` | Un solo proyecto de Vitest. |
| `pnpm test:e2e` | Playwright contra el build: hace `build` + `preview` en el puerto 4173 (reutiliza un servidor ya abierto ahí; ciérralo si el build cambió). |

Requisito de una sola vez: `pnpm exec playwright install chromium`.

## Problemas abiertos / bloqueos

- **Pendiente del responsable:** el **isotipo** de la iglesia (SVG o PNG transparente), en negro y blanco.
- **Marca:** el logo IASD no queda cubierto por la licencia MIT del repo público; anotarlo en `LICENSES.md` (P2 · Tarea 7).

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
| 2026-11-01 | P1 · revisión final: `ensureGradientContrast`; `ensureFontLoaded` carga también Latin Extended | `npm test` 136/136; `test:e2e` 2/2 | 9509bfd |
| 2026-11-01 | Migración de npm a pnpm | `pnpm typecheck` 0 errores; `pnpm test` 136/136; `pnpm test:e2e` 2/2; `pnpm build` OK | 2dd0440 |
| 2026-11-01 | P1 unido a `master` (fast-forward) | verificado en `master` | 2dd0440 |
| 2026-11-01 | P2 · T1: formato es-DO (`src/lib/format.ts`); pruebas con TZ `America/Santo_Domingo` | `pnpm test` 158/158 | bdc3331 |
| 2026-11-01 | P2 · T2: `FieldDef`/`AnnouncementTypeDef` y los 7 tipos (`src/slides/types/`) | `pnpm test` 181/181 | ver `git log` |
