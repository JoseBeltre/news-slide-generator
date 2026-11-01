# HANDOFF — Anuncios del Sábado

> **Regla de trabajo:** lee este archivo **antes de cada tarea** (si no está ya en el contexto: sesión nueva, después de un compact o en un subagente) y **actualízalo al terminar cada tarea**, en el mismo commit que la tarea. Es la memoria compartida entre sesiones y agentes.

## Estado actual

- **Fase:** 1 (MVP), pasos 1–7 en modo **solo local** (sin backend), según SRS §11.
- **Plan vigente:** `docs/superpowers/plans/2026-11-01-fase1-p2-tipos-datos-logos.md` (paso 3), aprobado; ejecución **nativa** en la rama `fase1/p2-tipos-datos-logos`. Ledger: `.superpowers/sdd/2026-11-01-fase1-p2-tipos-datos-logos/progress.md`. P1 está terminado y unido a `master`.
- **P2 hecho:** Tareas 1–7 (formato es-DO; 7 tipos declarativos; validación con Zod; Dexie y repositorio; imágenes comprimidas sin duplicados; color dominante; ministerios con logo IASD precargado). Revisión final hecha (sin Critical/Important del revisor; 3 menores re-graduados y arreglados). **Unido a `master`** (fast-forward, rama borrada); verificado en `master`: typecheck 0, `pnpm test` 233/233, `test:e2e` 2/2.
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

### API de datos y tipos (P2)

| Módulo | Qué ofrece |
|---|---|
| `src/lib/format.ts` | `formatDate`, `formatTime`, `formatMoney` (es-DO) |
| `src/slides/types/` | `ANNOUNCEMENT_TYPES`, `getTypeDef`, `validateValues` |
| `src/data/local/` | `createDb`, `createRepository` (borrado lógico), `saveImage`, `getImageBlob` |
| `src/lib/dominantColor.ts` | `dominantColor`, `dominantColorOfBlob` |
| `src/data/ministries.ts` | `CHURCH_MINISTRY_ID`, `PRELOADED_MINISTRIES` (iglesia, no se guarda en Dexie), `listMinistries(db)`, `logoCandidatesFor(selección, ministerios)` → `LogoCandidate[]` para `selectLogoVariant`, `logoUrlFor(id, ministerios)` → `LogoSource` |

## Próxima tarea

- Plan P3 escrito: `docs/superpowers/plans/2026-11-01-fase1-p3-plantillas-y-temas.md` (12 tareas), **aprobado; ejecución nativa** en la rama `fase1/p3-plantillas-y-temas`. Ledger: `.superpowers/sdd/2026-11-01-fase1-p3-plantillas-y-temas/progress.md`. Hecho: T1 (`formatEventDate`, `DateStyle`; `Settings.dateStyle/relativeDates`, override en `Announcement`); T2 (`src/slides/icons.ts` con `@lucide/vue`, `normalizeAnnouncement` → `NormalizedData`; `FieldDef.slidePrefix`); T3 (`src/slides/themes.ts`: `PRESET_THEMES` (neutro, vino, bosque, pizarra, cielo, arena), `TYPE_ACCENTS`, `resolveTheme`, `deriveTheme`); T4 (`src/slides/templates/`: `contract.ts` (`SlideContext`, `SlideSpec` con su paleta, `SlideStatus`), `registry.ts` (`buildSlides`, `templatesFor`, `paletteFor`), `SlideView.vue`, `parts/LogoSlot.vue`, `parts/SlideText.vue` (FitText que informa a la SlideView), `parts/SlideBackground.vue`, `cover/CoverSlide.vue`; galería en `pnpm dev` → `/galeria.html`, `?only=<id>`). **T5 en pausa: esperando que el responsable elija la dirección visual** (sobria / banda / cálida; capturas en `docs/slides-direcciones/`). Ya existe una versión básica de la Clásica (`classic/layout.ts`, `ClassicSlide.vue`, `parts/IconChip.vue`, `parts/EdgeDecoration.vue`, `parts/decoration.ts`) que T6 completa con pruebas. La Tarea 5 es un punto de parada: 3 direcciones visuales de las slides para que el responsable elija.

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
| 2026-11-01 | Zod 4: un campo con `defaultValue` nunca es opcional en el esquema (si lo fuera, Zod no aplica el preprocess a la clave ausente y el valor por defecto se pierde). Los `refine` de objeto corren aunque haya errores previos: protegerlos. | P2 · T3 |
| 2026-11-01 | Imágenes: volver a subir una imagen borrada **la revive** (mismo id, `deletedAt: null`), porque el índice `hash` es único. Medidas de un SVG: `width`/`height` numéricos o, si no, el `viewBox`; un SVG sin medidas se rechaza. | P2 · T5 |
| 2026-11-01 | Gestor de paquetes: **pnpm** en lugar de npm (pedido por el responsable). Migrado con `pnpm import`, conservando las versiones exactas; `engines.node >= 24`. | Responsable |
| 2026-11-01 | **Subir a GitHub en cada unión con `master`:** tras verificar las pruebas en `master`, `git push origin master` (solo `master`; otras ramas, force-push o PRs requieren pedido aparte). | Responsable |
| 2026-11-01 | **Diseño (P3 en adelante):** base principal `ui-ux-pro-max` para la web; un `DESIGN.md` de designmd.app como sistema de diseño **solo de la interfaz** (formularios, listas, navegación; se elige en P4 y **lo elige el responsable** entre 3 opciones fundamentadas). **No aplica a las slides**: sus temas y plantillas tienen estilo propio y normalmente difieren de la interfaz; para slides consultar también `ui-ux-pro-max:slides` y `ecc:frontend-slides`. **La UX es la prioridad.** Las reglas de §5 (mínimos de tamaño, contraste 7:1) mandan sobre cualquier estilo que sugiera un skill o el DESIGN.md. | Responsable |
| 2026-11-01 | **Formato de fecha configurable** (amplía §3.2): estilos `largo` ("Sábado 7 de noviembre"), `medio` ("SÁBADO 7 DE NOV"), `corto` ("SÁB 7"; con "NOV" si es otro mes) y `corto-mes-completo` ("SÁB 7"; con "NOVIEMBRE" si es otro mes); fechas relativas opcionales "HOY" / "ESTA NOCHE" (≥ 18:00) / "MAÑANA", calculadas contra la **fecha de la presentación**. Por defecto en Configuración; cada anuncio puede cambiarlo. Mayúsculas solo en una línea (§5.2). Plan P3, Tarea 1. | Responsable |
| 2026-11-01 | Íconos: **`@lucide/vue`** (el plan decía `lucide-vue-next`, que está obsoleto). Fecha y primera hora del tipo van en **una fila** ("Sábado 7 de noviembre · 7:00 p. m."). `FieldDef.slidePrefix` para los datos que el ícono solo no explica: "Llevar:" (qué llevar) y "Hasta el" (fecha límite). | P3 · T2 |
| 2026-11-01 | Temas: `Theme.background`→`secondary` es el degradado del fondo y `primary` el acento de portada/cierre; en los anuncios el acento es el del **tipo** (§9). El acento nunca es color de texto informativo: solo decoración y chip del ícono (≥ 3:1 contra el fondo, su ícono ≥ 7:1). `deriveTheme(primario)` usa el color como fondo. Un amarillo claro (`#fff59d`) **no** necesita ajuste (texto negro 18.8:1); se ajustan los tonos medios (`#777777`). | P3 · T3 |
| 2026-11-01 | Cada `SlideSpec` lleva su **paleta ya resuelta** (vista previa, miniaturas y ventana pública dibujan igual sin recalcular). `SlideContext.loadImage(id)` en vez de pasar la base de datos. Los textos de plantilla usan `SlideText`, que informa su ajuste a la `SlideView` por provide/inject. Playwright: proyecto `chromium` (build, 4173) y `galeria` (`pnpm dev`, 5174). | P3 · T4 |
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

## Problemas abiertos

- Menores diferidos de la revisión P2 (para P4): mensaje de precio inválido igual al de negativo ("500" texto o NaN → "no puede ser negativo"); `settings` sin índice `updatedAt` → `repository.list()` fallaría (indexarlo antes de tener datos); `put` copia superficial → al guardar objetos `reactive()` usar `toRaw`/`structuredClone`. / bloqueos

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
| 2026-11-01 | P2 · T2: `FieldDef`/`AnnouncementTypeDef` y los 7 tipos (`src/slides/types/`) | `pnpm test` 181/181 | 62c00b6 |
| 2026-11-01 | P2 · T3: `validateValues` con Zod 4 y mensajes en español | `pnpm test` 197/197 | 9ff24c0 |
| 2026-11-01 | P2 · T4: `models.ts` (§7), `AppDb` v1 (7 tablas), `createRepository` con borrado lógico | `pnpm test` 203/203 | 725f60c |
| 2026-11-01 | P2 · T5: `saveImage` (WebP 0.82, ≤2560/1600 px, SVG intacto, SHA-256, sin duplicados) | `pnpm test` 215/215 | 6c8cff1 |
| 2026-11-01 | P2 · T6: `dominantColor` / `dominantColorOfBlob` | `pnpm test` 223/223 | afb1eef |
| 2026-11-01 | P2 · T7: `src/data/ministries.ts` (iglesia precargada, candidatos de logo, `listMinistries`) | typecheck 0; `pnpm test` 231/231; `test:e2e` 2/2; build OK | 43eebcc |
| 2026-11-01 | P2 · revisión final: `photoId` vacío = sin foto (sin error en inglés); `formatMoney` redondea a centavos; `.vitest/` fuera del repo | typecheck 0; `pnpm test` 233/233; `test:e2e` 2/2; build OK | 35a579d |
| 2026-11-01 | P2 unido a `master` (fast-forward) | verificado en `master`: 233/233, E2E 2/2 | 35a579d |
| 2026-11-01 | P3 · T1: `formatEventDate` (4 estilos + relativas) | `format.test.ts` 42/42; typecheck 0 | ver `git log` |
| 2026-11-01 | P3 · T2: íconos locales y `normalizeAnnouncement` | `tests/unit/slides` 10/10; typecheck 0 | ver `git log` |
| 2026-11-01 | P3 · T3: temas con contraste garantizado y color personalizado | `themes.test.ts` 13/13 | ver `git log` |
| 2026-11-01 | P3 · T4: contrato, `SlideView`, logo automático, portada, galería | `SlideView.test.ts` 5/5; typecheck 0; build sin galería; `test:e2e` 2/2 | ver `git log` |
