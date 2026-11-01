# HANDOFF — Anuncios del Sábado

> **Regla de trabajo:** lee este archivo **antes de cada tarea** (si no está ya en el contexto: sesión nueva, después de un compact o en un subagente) y **actualízalo al terminar cada tarea**, en el mismo commit que la tarea. Es la memoria compartida entre sesiones y agentes.

## Estado actual

- **Fase:** 1 (MVP), pasos 1–7 en modo **solo local** (sin backend), según SRS §11.
- **P3 en curso** (rama `fase1/p3-plantillas-y-temas`, sin subir): Tareas 1–5 hechas. T5 cerró con **3 estilos de slide aprobados** (Himnario, Almanaque, Cartel), todos elegibles por anuncio, más la portada en cada estilo. Capturas: `docs/slides-direcciones/` (`hoja-<estilo>.png` resume cada uno; rondas rechazadas en `ronda-1/` y `ronda-2/`).
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
| `src/data/ministries.ts` | `CHURCH_MINISTRY_ID`, `PRELOADED_MINISTRIES` (iglesia, no se guarda en Dexie), `listMinistries(db)`, `logoGroupFor(selección, ministerios)` → un `LogoCandidate[]` por ministerio (1–3, con forma logotipo/isotipo), `logoCandidatesFor` (todos juntos), `logoUrlFor(id, ministerios)` → `LogoSource`, `MAX_LOGOS` |

### Plantillas (P3)

| Módulo | Qué ofrece |
|---|---|
| `src/slides/styles.ts` | `SlideStyleId` (`himnario` / `almanaque` / `cartel`), `SLIDE_STYLES`, `DEFAULT_SLIDE_STYLE` (`almanaque`, provisional) |
| `templates/classic/` | `ClassicSlide` elige `HimnarioSlide` / `AlmanaqueSlide` / `CartelSlide` por `spec.slideStyle`; `layout.ts`: `stackRows` (filas desde abajo), `rowLines`, `titleSlot` (hasta 4 líneas), `lineSlot`, `detailRows`, `monthLabel` |
| `templates/cover/` | `CoverSlide` → `CoverHimnario` / `CoverAlmanaque` / `CoverCartel` |
| `templates/parts/` | `LogoGroup` (1–3 logos en partes iguales), `LogoSlot` (un logo por candidatos), `HimnarioCover`, `AlmanaqueSheet`, `CartelField`, `Texture` (tela / renglones / trama, con `texturedStops` para el data-bg), `Fleuron`, `TypeEmblem` |
| `normalize.ts` | `NormalizedData.when`: la fecha principal en piezas (`weekday`, `day`, `month`, `relative`, `year`, `time`) para dibujarla como protagonista |
| `themes.ts` | `SlidePalette.field`/`onField` (color puro del tipo para hojas y campos), `accentInk`, `mixColors` |
| `scripts/capturar-galeria.mjs` | `node scripts/capturar-galeria.mjs <prefijo> <carpeta>` con `pnpm dev --port 5174` abierto: captura 1920×1080 y lista violaciones de `auditSlide` |

## Próxima tarea

P3 sigue en la rama `fase1/p3-plantillas-y-temas` (sin subir). T1–T5 hechas (T5 = rediseño: estilos Himnario, Almanaque y Cartel). Antes de seguir hay que **ajustar el plan de T6–T12** al rediseño (3 estilos, 1–3 logos, mínimos v1.4). Reparto acordado con el responsable:

- **Cumpleaños (T8 reparto y T9 plantillas) → la sesión del rediseño** ("Rediseño visual de las slides (P3 · Tarea 5)"), en el mismo lenguaje visual de los 3 estilos.
- **El resto (T6 pruebas de la Clásica, T7 Visual, T10 imagen, T11 cierre, T12 matriz §5.7 y capturas) → la sesión principal.** No tocar los mismos archivos que la de cumpleaños a la vez.
- Al terminar P3: revisión final de la rama, unir a `master`, `git push origin master` y borrar la rama local `backup/p3-antes-de-limpiar`.
- Después, **P4** (formularios y vista previa): presentar 3 `DESIGN.md` de designmd.app para la interfaz y que el responsable elija.

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
| 2026-11-01 | **Diseño de slides:** cumplir §5 no basta; deben tener composición, jerarquía y riqueza visual ("corazón"), no una lista de datos con íconos. El responsable acepta bajar **un poco** los tamaños de §5.3 por un mejor diseño (números por confirmar). Las 3 primeras direcciones se rechazaron. | Responsable |
| 2026-11-01 | **Mínimos de §5.3 bajados ~12 % (SRS v1.4, opción "moderada"):** título 84, datos clave 60, secundario 44, cumpleaños uno 108, varios 54, metadatos 32. Íconos de §5.4 **opcionales**, ≥ 56 px si se dibujan. | Responsable |
| 2026-11-01 | **Tres estilos de slide aprobados** ("ahora sí"): **Himnario** (tapa de tela, filetes dorados, la fecha como número del himno), **Almanaque** (hoja de almanaque del color del tipo, logos en la cabecera, hora en el talón) y **Cartel** (afiche caribeño, campo de color en diagonal, trama de imprenta). Los tres sirven para todos los tipos menos cumpleaños; cada anuncio elige (`Announcement.slideStyle`) y Configuración tiene uno por defecto (`Settings.slideStyle`, provisional `almanaque`). Más adelante habrá más estilos y fuentes. | Responsable |
| 2026-11-01 | **Interlineado por rol (§5.2 v1.4):** títulos y nombres 1.05, secundario 1.1, datos de una línea y metadatos 1.2. Las descripciones cortas reservan una sola línea. | Responsable |
| 2026-11-01 | **Logos:** existe el **isotipo** (logo circular, variante `cuadrado`) y un anuncio puede llevar **hasta 2 ministerios y, en casos especiales, 3**. `LogoSelection` gana `form` (`logotipo`/`isotipo`) y `kind: 'varios'`. | Responsable |
| 2026-11-01 | `PRODUCT.md` (resumen de producto para el skill `impeccable`; manda el SRS). Las slides **no** usan el `DESIGN.md` de la interfaz. | Tarea 5 |
| 2026-11-01 | **Capturas de slides solo en local:** `docs/slides-direcciones/` está en `.gitignore` (pedido del responsable; pesaban 52 MB). Se sacaron del historial no subido de la rama P3 (respaldo: rama local `backup/p3-antes-de-limpiar`). Se regeneran con la galería (`pnpm dev` → `/galeria.html?only=<id>`). | Responsable |
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

- **Pendiente del responsable:** el **isotipo** de la iglesia (SVG o PNG transparente), en negro y blanco. Las plantillas ya lo soportan: al agregarlo como variantes `cuadrado` de la iglesia en `PRELOADED_MINISTRIES`, `form: 'isotipo'` lo usará solo. Mientras tanto la galería usa ministerios **sintéticos** (`tests/fixtures/ministries.ts`).
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
| 2026-11-01 | P3 · T5: rediseño — mínimos v1.4, 3 estilos (Himnario, Almanaque, Cartel) con portada, interlineado por rol, grupos de logos e isotipo | typecheck 0; `pnpm test` 294/294; 30 slides de galería sin violaciones de `auditSlide` | ver `git log` |
