# P9 · Anuncios públicos — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una página pública fija, `/anuncios/publico`, con los anuncios vigentes en texto para la congregación. Funciona sin internet, comparte la imagen "A" y deja fuera a los bots de IA.

**Architecture:**
- **Datos:** una función `security definer` de Supabase (`public_notices()`) entrega solo los campos públicos.
- **Página:** una segunda entrada de Vite (`publico.html` + `src/public-notices/`) la pide con un `fetch` y la dibuja con `normalizeAnnouncement`, igual que las slides.
- **Sin internet:** la guarda en `localStorage` y la sirve un Service Worker pequeño con scope propio.
- **En la app:** la casilla "Mostrar al público" y el botón "Compartir los anuncios".
- **Servidor:** `.htaccess`, `robots.txt` y metas cierran el paso a los bots de IA y dejan pasar a Google, Bing y los robots de vista previa.

**Tech Stack:** Vue 3, Vite 7 (multi-entrada), TS, Tailwind v4, Zod 4, vite-plugin-pwa, PGlite (pruebas SQL), Vitest (unit/browser), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-05-p9-anuncios-publicos-design.md`

## Global Constraints

### Reglas del proyecto
- **HANDOFF:** se lee antes de cada tarea y se actualiza en el commit de la última.
- **Commits:** en español, con el ID del SRS (`[§11 paso 9, RF-70…75]`), y terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Herramientas:** pnpm.
- **Estilos:** solo Tailwind, sin CSS a mano en `.vue`; la prueba de arquitectura también marca `@apply`, aunque sea el nombre de un evento.
- **Tamaño de los archivos:** `*Page.vue` ≤ 80 líneas, componente ≤ 150, `.ts` ≤ 200.
- **Imports:** no se importa de una feature a otra, salvo de `shared/`. Todo `<button>` lleva `cursor-pointer`.
- **Diseño:** DESIGN.md manda solo en la interfaz; la página pública usa sus tokens (`src/ui/styles.css`).
- **Rama:** `fase1-p9-anuncios-publicos`, que sale de master.

### Aprobación del diseño (regla del responsable)
- **Antes de programar lo visual:** se le muestra al responsable un mockup y se espera su visto bueno explícito. Lo visual es:
  - la página pública (Task 4);
  - la imagen "A" (Task 7);
  - el botón de Inicio (Task 7);
  - la casilla y la etiqueta (Task 1).
- **Un mockup rechazado** se rehace; no se programa encima.
- **Al terminar:** una captura de lo construido (375 px y escritorio, claro y oscuro) también necesita su visto bueno.
- **Nada se une a master ni se sube sin su OK.**
- **Estos pasos detienen la ejecución:** son las únicas pausas del plan, además de las de siempre.

### Textos exactos
| Dónde | Texto |
|---|---|
| Título de la página y `og:title` | "Anuncios · Mansedumbre II" |
| Casilla del editor | "Mostrar al público" |
| Fila de un anuncio oculto | ícono de ojo tachado (`EyeOff`) junto al nombre, con texto para lectores de pantalla "Oculto al público" |
| Botón de Inicio | "Compartir los anuncios" |
| Enlace al lado del botón | "Ver" |
| Aviso tras copiar | "Enlace copiado" |
| Página sin anuncios | "No hay anuncios por ahora." |
| Sin internet y sin caché | "Ábrela una vez con internet para guardarla en este celular." |
| Error sin caché | "No se pudieron cargar los anuncios. Prueba más tarde." |
| Con datos frescos | "Actualizado el {fecha}" |
| Con caché | "Sin conexión · guardado el {fecha}" |

### Valores fijos
- **URL pública:** `https://anunciosm2.jose-web.com/anuncios/publico`.
- **Imagen:** `https://anunciosm2.jose-web.com/og-publico.png` (1200×630).
- **Clave de la caché:** `anuncios-publicos:v1`.
- **"Hoy":** `America/Santo_Domingo`.
- **Tipos que nunca se publican:** `cumpleanos` e `imagen`.

### Bots de IA bloqueados (403 en `.htaccess` y `Disallow: /` en `robots.txt`)
`GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai, PerplexityBot, Perplexity-User, CCBot, Bytespider, Amazonbot, meta-externalagent, Applebot-Extended, cohere-ai, Diffbot, YouBot, DuckAssistBot, MistralAI-User, Google-CloudVertexBot`

En `robots.txt` se agrega además `Google-Extended`.

### Robots de vista previa permitidos
`facebookexternalhit, Facebot, WhatsApp, Twitterbot, Discordbot, TelegramBot, Slackbot-LinkExpanding, LinkedInBot, Pinterestbot, SkypeUriPreview, Viber`

## Review Focus

1. **El registro del Service Worker de la app llega a `publico.html`.** vite-plugin-pwa inyecta el registro (y quizá el enlace al manifiesto) en todas las entradas HTML. Un celular de la congregación bajaría la app entera y se ofrecería a instalarla.
   - **Se espera:** `dist/publico.html` sin `registerSW` ni `rel="manifest"`.
   - **Lo prueba:** Task 5.
2. **Google ve la página vacía.** Si `robots.txt` no deja pasar a Googlebot y Bingbot a `/assets/`, el buscador no puede ejecutar el JS.
   - **Se espera:** `Allow: /assets/` en sus grupos.
   - **Lo prueba:** Task 6.
3. **Un dato raro tumba la página entera.** Puede venir un tipo desconocido (de una versión más nueva), unos `values` incompletos o `normalizeAnnouncement` puede lanzar un error.
   - **Se espera:** ese anuncio se omite y el resto se ve.
   - **Lo prueba:** Task 3.
4. **Respuesta con otra forma.** Un HTML de error del proxy, un `null` o un JSON sin `notices`.
   - **Se espera:** se trata como error, con caché si la hay, y nunca se guarda en la caché.
   - **Lo prueba:** Task 3.
5. **"Hoy" en la noche de Santo Domingo.** A las 23:30 en Santo Domingo, en UTC ya es el día siguiente.
   - **Se espera:** el anuncio de hoy sigue saliendo.
   - **Lo prueba:** Task 2.

---

### Task 1: Casilla "Mostrar al público" y etiqueta en la fila

**Files:**
- Modify: `src/data/models.ts` (Announcement), `src/data/transfer/format.ts` (announcement schema), `src/features/announcements/editor/options/SlideOptions.vue`, `src/features/announcements/shared/AnnouncementRow.vue`
- Test: `tests/browser/features/public-toggle.test.ts`, `tests/browser/data/transfer.test.ts` (una prueba más)

**Interfaces:**
- **Produce:** `Announcement.showPublic?: boolean`. `undefined` significa visible. Se guarda `false` solo al desmarcar; al volver a marcar se guarda `undefined`.

- [ ] **Step 0: Mockup y aprobación.** Se muestran dos cosas: dónde va la casilla en las opciones del editor y cómo se ve la etiqueta en la fila, en móvil y en escritorio. **Se espera el visto bueno del responsable.**

- [ ] **Step 1: Write the failing tests.** Usan `mountApp` y `seed` de `tests/browser/helpers/app`. Son cinco:
  1. **`'la casilla Mostrar al público sale marcada en un anuncio nuevo'`:** en `/nuevo/aviso`, `byLabel(host,'Mostrar al público')` es un checkbox `checked`.
  2. **`'desmarcarla y guardar deja showPublic false'`:** se desmarca, se guarda con el botón de guardar del editor y `(await db.announcements.toArray())[0].showPublic` es `false`.
  3. **`'no sale en cumpleaños ni en imagen'`:** en `/nuevo/cumpleanos` y en `/nuevo/imagen`, `byLabel(host,'Mostrar al público')` es `null`.
  4. **`'un anuncio oculto lleva el ojo tachado junto al nombre'`:** se siembra `seed(db,{typeId:'aviso',values:{titulo:'X'},showPublic:false})`; en `/anuncios` su fila tiene `[data-hidden-public]` con el texto accesible "Oculto al público". Otro sin el campo no lo tiene.
  5. **En `transfer.test.ts`: `'exportar e importar conserva showPublic false'`.**

- [ ] **Step 2: Run them.** `pnpm vitest run --project browser tests/browser/features/public-toggle.test.ts tests/browser/data/transfer.test.ts`. Expected: FAIL en las cinco pruebas nuevas.

- [ ] **Step 3: Implement.**
  - **Modelo:** `showPublic?: boolean` en `Announcement`, con un comentario.
  - **Esquema del traspaso:** `showPublic: z.boolean().optional()` en `announcement`.
  - **Editor (`SlideOptions.vue`):** dentro del bloque `typeDef.id !== 'imagen'` y solo si `typeDef.id !== 'cumpleanos'`, un `OptionGroup title="Público"` con `UiCheckbox`. Su valor es `draft.showPublic !== false`; al cambiar hace `draft.showPublic = v ? undefined : false`.
  - **Fila (`AnnouncementRow.vue`):** si `announcement.showPublic === false`, un ícono `EyeOff` (16 px, `text-ink-muted`, `aria-hidden`) junto al título, más un `sr-only` "Oculto al público", envueltos en `span data-hidden-public`. Sin etiqueta.

- [ ] **Step 4: Run** el mismo comando. Expected: PASS.

- [ ] **Step 5: Commit** `feat(anuncios): casilla Mostrar al público [RF-72]`.

### Task 2: Función `public_notices()` en Supabase

**Files:**
- Create: `supabase/migrations/20261105000000_anuncios_publicos.sql`
- Test: `tests/unit/db/publicNotices.test.ts` (usa `openDb`, `as` y `row` de `./helpers`)

**Interfaces:**
- **Produce `public.public_notices() returns jsonb`.**
  - Su forma es `{ today: 'YYYY-MM-DD', settings: { timeFormat?, currency?, dateStyle? }, notices: [{ id, typeId, values, eventDate: string|null, updatedAt }] }`.
  - La puede ejecutar `anon`.
  - Por dentro llama a `public._public_notices_at(p_now timestamptz)`, que nadie más que el dueño puede ejecutar. Así las pruebas fijan la hora sin que `anon` pueda pedir otra.

- [ ] **Step 1: Write the failing tests.** Se siembra con `sync_push` como editor (`ANA`, igual que en `sync.test.ts`) y se lee la interna como dueño: `db.query("select public._public_notices_at($1) as r", [...])`. Cada prueba siembra el anuncio con `data: { typeId, status, eventDate, showPublic, values, presenterNotes, createdBy, updatedBy, … }`.
  - **`'sale un anuncio vigente y uno sin fecha, ordenados con el sin fecha al final'`:** con `p_now = '2026-11-05T15:00:00Z'`, los ids salen en el orden `['a-hoy', 'a-manana', 'a-sin-fecha']`.
  - **`'no salen: pasado, borrado, borrador, cumpleanos, imagen, showPublic false'`:** seis filas, `notices` es `[]`. Uno sin `showPublic` sí sale, y uno con `status 'no_cabe'` también.
  - **`'nunca salen las notas ni los autores ni la foto'`:**
    - el JSON de la notice no tiene `presenterNotes`, `createdBy`, `updatedBy`, `status` ni `showPublic`;
    - `values` no tiene `fotoPredicador`.
    - **Las claves de imagen salen de las definiciones:** se calculan con `ANNOUNCEMENT_TYPES` (los campos `kind:'image'` de los tipos publicables) y se espera que ninguna esté en `values`. Así un campo de imagen nuevo hace fallar la prueba.
  - **`'hoy es el de Santo Domingo'`:** con `p_now = '2026-11-06T03:30:00Z'` (23:30 del 5 en Santo Domingo), un anuncio con `eventDate '2026-11-05'` sale y `today` es `'2026-11-05'`.
  - **`'trae la configuración pública'`:** con la fila `settings` `id 'configuracion'` y `data {timeFormat:'24h', currency:'USD', dateStyle:'corto', coverTitle:'x'}`, `settings` es exactamente `{timeFormat:'24h', currency:'USD', dateStyle:'corto'}`. Sin esa fila, es `{}`.
  - **`'anon ejecuta public_notices pero no la interna ni las tablas'`:**
    - `as(db, null, 'select public.public_notices() as r')` resuelve;
    - `as(db, null, "select public._public_notices_at(now())")` rechaza con `/permission denied/`;
    - `select * from public.announcements` como `anon` sigue rechazando.

- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/unit/db/publicNotices.test.ts`. Expected: FAIL ("function public._public_notices_at… does not exist").

- [ ] **Step 3: Implement la migración.** Las dos funciones son `language sql stable security definer set search_path = ''`.
  - **"Hoy":** `(p_now at time zone 'America/Santo_Domingo')::date`.
  - **Filtros:** los del spec §1. El orden es `order by a.data->>'eventDate' nulls last, a.id`.
  - **`values`:** `a.data->'values' - array['fotoPredicador']`, con la lista de claves de imagen escrita en el SQL.
  - **`settings`:** sale de `public.settings where id = 'configuracion' and deleted_at is null`. Se omiten las claves nulas con `jsonb_strip_nulls`.
  - **Permisos:**
    - `revoke all` de ambas funciones a `public, anon, authenticated`;
    - `grant execute on function public.public_notices()` a `anon, authenticated`.
  - **Si PGlite no trae la zona `America/Santo_Domingo`:** se usa `(p_now at time zone 'UTC' - interval '4 hours')::date`. Santo Domingo no tiene horario de verano. Se anota como Ruling.

- [ ] **Step 4: Run** el mismo comando y también `tests/unit/db/sync.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit** `feat(nube): función pública de anuncios vigentes [§8.5, RF-72, RF-74]`.

### Task 3: Carga, caché y tarjetas (lógica pura)

**Files:**
- Create: `src/public-notices/types.ts`, `src/public-notices/load.ts`, `src/public-notices/cards.ts`
- Test: `tests/unit/public-notices/load.test.ts`, `tests/unit/public-notices/cards.test.ts`

**Interfaces:**
- **Consume:** `normalizeAnnouncement` (`src/slides/normalize.ts`), `getTypeDef` y `ANNOUNCEMENT_TYPES` (`src/slides/types/definitions.ts`), `supabaseConfig` y `fetchWithTimeout` (`src/data/sync/supabase.ts`), y `DateStyle` (`src/lib/format.ts`).
- **Produce en `types.ts`:**
  - `PublicNotice { id: string; typeId: string; values: Record<string, unknown>; eventDate: string | null; updatedAt: string }`
  - `PublicNoticesData { today: string; settings: { timeFormat?: '12h'|'24h'; currency?: string; dateStyle?: DateStyle }; notices: PublicNotice[] }`
  - `LoadState`, que es uno de:
    - `{ kind: 'fresh'; data: PublicNoticesData; savedAt: string }`
    - `{ kind: 'cached'; data: PublicNoticesData; savedAt: string }`
    - `{ kind: 'offline' }`
    - `{ kind: 'error' }`
  - `NoticeCard { id: string; number: number; title: string; rows: { icon?: string; text: string }[] }`
- **Produce en `load.ts`:**
  - `CACHE_KEY = 'anuncios-publicos:v1'`.
  - `loadNotices(deps: { config: SupabaseConfig | null; fetch: typeof fetch; storage: Storage | null; now: () => Date }): Promise<LoadState>`.
    - **Petición:** `POST ${url}/rest/v1/rpc/public_notices`, con las cabeceras `apikey: key` y `Content-Type: application/json`, y el cuerpo `'{}'`. Va con `fetchWithTimeout(15_000, deps.fetch)`.
    - **Validación:** la respuesta se valida con un esquema Zod.
    - **Si la respuesta es buena:** se guarda `{data, savedAt}` en `storage` (con `try/catch`) y devuelve `fresh`.
    - **Si el `fetch` lanza `TypeError` o se vence el tiempo:** devuelve `cached` si hay caché válida y, si no, `offline`.
    - **Si no es `ok`, la forma es mala o no hay `config`:** devuelve `cached` si hay caché y, si no, `error`.
- **Produce en `cards.ts`:**
  - `noticeCards(data: PublicNoticesData): NoticeCard[]`. Llama a `normalizeAnnouncement(typeId, values, { today: data.today, reference: data.today, ...data.settings })`.
    - **Título:** `normalized.title?.text`, o el `name` del tipo si no hay.
    - **Filas:** `normalized.rows` como `{icon, text}`.
    - **Número:** el orden, desde 1, sin contar los omitidos.
    - **Se omite el anuncio:** si su tipo es desconocido, si es `cumpleanos` o `imagen`, o si `normalizeAnnouncement` lanza.
  - `stateLabel(state: LoadState): string | null`. Devuelve "Actualizado el {d}" o "Sin conexión · guardado el {d}", con `d` = `Intl.DateTimeFormat('es-DO', { weekday:'long', day:'numeric', month:'long', hour:'numeric', minute:'2-digit', timeZone:'America/Santo_Domingo' })`. En los otros casos devuelve `null`.

- [ ] **Step 1: Write the failing tests.**
  - **`load.test.ts`** (`fetch` simulado y un `Storage` en memoria):
    - `'respuesta buena → fresh y la guarda'`: comprueba la URL, el método, la cabecera `apikey` y la clave de la caché.
    - `'sin red con caché → cached'`.
    - `'sin red sin caché → offline'`.
    - `'500 con caché → cached; sin caché → error'`.
    - `'HTML o null o sin notices → error y no pisa la caché'`.
    - `'sin config → error sin llamar a fetch'`.
    - `'storage que lanza no rompe'`.
    - `'caché corrupta se ignora'`.
  - **`cards.test.ts`:**
    - `'un culto da título y filas de fecha, hora y lugar con sus íconos'`: comprueba `icon` `'calendar'`, `'clock'` y `'map-pin'`, y los textos con el formato de la configuración (`'24h'` da `"19:00"`).
    - `'numera seguido y omite un tipo desconocido o cumpleaños'`.
    - `'un anuncio que hace lanzar a normalize se omite'` (por ejemplo, `values` con `fecha: 42`).
    - `'stateLabel'`: fresh da "Actualizado el jueves 5 de noviembre, …" y cached da "Sin conexión · guardado el …".

- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/unit/public-notices`. Expected: FAIL (no existen los módulos).

- [ ] **Step 3: Implement** los tres módulos con las firmas de arriba.

- [ ] **Step 4: Run.** Expected: PASS.

- [ ] **Step 5: Commit** `feat(publico): carga con caché y tarjetas de los anuncios públicos [RF-70, RF-73]`.

### Task 4: La página (entrada de Vite y componentes)

**Files:**
- Create: `publico.html`, `src/public-notices/main.ts`, `src/public-notices/PublicNoticesApp.vue`, `src/public-notices/NoticeCardView.vue`, `src/public-notices/RowIcon.vue` (si hace falta para no pasar de 150 líneas)
- Modify: `vite.config.ts` (`build.rollupOptions.input = { main: 'index.html', publico: 'publico.html' }`)
- Test: `tests/browser/public-notices/page.test.ts`

**Interfaces:**
- **Consume:** de Task 3, `LoadState`, `loadNotices`, `noticeCards` y `stateLabel`. De `src/slides/icons.ts`, el mapa de íconos Lucide (se usa el export que ya tiene).
- **Produce:** `PublicNoticesApp.vue` con la prop `load?: () => Promise<LoadState>`. Sin ella, llama a `loadNotices` con `supabaseConfig()`, `fetch`, `localStorage` y `() => new Date()`.
- **`main.ts`:**
  - importa `../ui/styles.css` y `../ui/fonts`, y monta la app;
  - **sin `applySavedTheme`:** sigue el tema del sistema;
  - **registra el Service Worker** solo si `import.meta.env.PROD` y la ruta empieza con `/anuncios/publico`: `navigator.serviceWorker?.register('/publico-sw.js', { scope: '/anuncios/publico' })`, con `catch` silencioso.

- [ ] **Step 0: Mockup y aprobación.** El mockup de la página pública debe cumplir:
  - **Formatos:** celular de 375 px y escritorio, en claro y en oscuro.
  - **Contenido:** el encabezado, tres tarjetas con datos reales de ejemplo y los estados vacío y sin conexión.
  - **Diseño:** sigue DESIGN.md y la nota "con corazón, no plano" de la memoria del proyecto; los mayores leen esta página.

  **Se espera el visto bueno del responsable.** Si pide cambios, se ajustan los textos o las pruebas de este task antes de seguir.

- [ ] **Step 1: Write the failing tests.** Montan `PublicNoticesApp` con `load` inyectado.
  - **`'dibuja las tarjetas numeradas con su título y filas'`:** `[data-notice-card]` tiene 2 y el primer número es "1".
  - **`'muestra Actualizado el … con datos frescos'`.**
  - **`'vacío: No hay anuncios por ahora.'`.**
  - **`'offline sin caché: Ábrela una vez con internet…'`.**
  - **`'error sin caché: No se pudieron cargar los anuncios. Prueba más tarde.'`.**
  - **`'cached: Sin conexión · guardado el … y las tarjetas'`.**
  - **`'el título de la página es un h1 Anuncios · Mansedumbre II'`.**
  - **`'datos a 15–16 px y títulos a 18 px'`:** `getComputedStyle`: las filas de datos dan `fontSize` 15 o 16 y el título de la tarjeta da 18.
  - **`'mientras carga hay esqueleto con aria-busy'`.**

- [ ] **Step 2: Run** `pnpm vitest run --project browser tests/browser/public-notices`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **`publico.html`:**
    - `lang="es-DO"` y `<title>Anuncios · Mansedumbre II</title>`;
    - `meta description` "Los anuncios de la Iglesia Adventista Mansedumbre II, siempre al día.";
    - `meta robots` "index, follow";
    - `theme-color` claro y oscuro, como `index.html`, y los mismos íconos;
    - `link rel=canonical` y `og:url` apuntando a la URL pública;
    - `og:type` website, `og:site_name` "Anuncios del Sábado", `og:title`, `og:description`;
    - `og:image` (con su ancho, alto y `og:image:alt` "Anuncios de Mansedumbre II"), `og:locale es_DO` y `twitter:card summary_large_image`;
    - `body` con las clases `bg-background font-sans text-ink antialiased`, y `<script type="module" src="/src/public-notices/main.ts">`.
  - **Estructura:** `PublicNoticesApp` tiene el encabezado (`h1` en Instrument Serif más la etiqueta de estado) y una lista `ol` con las tarjetas.
  - **`NoticeCardView`:** el número en tipo `meta`, el título y las filas con su ícono `aria-hidden`.
  - **Letra:** datos a 15 px y títulos de tarjeta a 18 px, con alto contraste usando los tokens. Sigue el mockup aprobado v2 (`.superpowers/sdd/…/mockup-p9.html`): el número en un recuadro con el color del tipo y el nombre del tipo arriba del título, a todo el ancho.

- [ ] **Step 4: Run** el mismo comando, más `pnpm typecheck` y la prueba de arquitectura `pnpm vitest run --project unit tests/unit/architecture.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit** `feat(publico): página de anuncios públicos [RF-70, RF-71]`.

### Task 5: Sin internet y convivencia con la app

**Files:**
- Create: `public/publico-sw.js`
- Modify:
  - `vite.config.ts`:
    - `injectRegister: false`;
    - `workbox.navigateFallbackDenylist: [/^\/anuncios\/publico/, /^\/publico\.html/]`;
    - un plugin con `configureServer` y `configurePreviewServer` que reescribe `/anuncios/publico` y `/anuncios/publico/` a `/publico.html`.
  - `src/main.ts` (registro de la app con `virtual:pwa-register`: `registerSW({ immediate: true })`).
  - `src/env.d.ts` (`/// <reference types="vite-plugin-pwa/client" />`).
  - `src/app/router.ts` (ruta `/anuncios/publico` antes de `/anuncios/:id`, con un `beforeEnter` que hace `window.location.assign('/anuncios/publico')` y devuelve `false`).
- Test: `tests/e2e/publico.spec.ts`, `tests/unit/app/router.test.ts` (una prueba más)

**Interfaces:**
- **Consume:** `publico.html` (Task 4).
- **Produce `publico-sw.js`, con la caché `publico-v1`.**
  - **Al instalarse:** hace `skipWaiting`.
  - **Al activarse:** hace `clients.claim()` y borra las cachés `publico-*` que no son la suya.
  - **Navegación bajo `/anuncios/publico`:** primero la red y luego guarda la respuesta. Sin red, sirve lo guardado.
  - **`/assets/*` y fuentes del mismo origen:** primero la caché y, si no está, la red y se guarda.
  - **Todo lo demás, incluida la llamada a Supabase:** pasa sin tocarlo.

- [ ] **Step 1: Write the failing tests.**
  - **En `router.test.ts`:** `'/anuncios/publico no abre el editor'`. La ruta resuelta tiene `name: 'anuncios-publico'` y no es `editar`.
  - **En `publico.spec.ts`:**
    - **Cambio frente al spec:** el spec pide una E2E con la llamada a Supabase simulada. El build de E2E no tiene nube (`playwright.config.ts`), así que la página no hace la llamada. El dibujo con datos lo cubren las pruebas browser de Task 4, y aquí se prueban la ruta, las metas y el modo sin internet.
    - `'/anuncios/publico sirve la página pública con sus metas'`: el `h1` dice "Anuncios · Mansedumbre II"; `meta[property="og:image"]` termina en `/og-publico.png`; `meta[name=robots]` es "index, follow". Como el build de E2E no tiene nube, la página dice "No se pudieron cargar los anuncios. Prueba más tarde.".
    - `'el HTML público no registra la app ni enlaza su manifiesto'`: `request.get('/publico.html')` no contiene `registerSW` ni `rel="manifest"`.
    - `'la app sigue con noindex'`: `/` trae `meta robots` "noindex, nofollow".
    - `'abre sin internet tras una visita'`: se visita, se espera a `navigator.serviceWorker.ready`, se recarga una vez (para que el Service Worker controle la página) y se pasa a `context.setOffline(true)`. Al recargar se ve el `h1` y el mensaje de "Ábrela una vez…" o el de error, nunca la página del navegador sin conexión.
    - `'la app sigue funcionando sin internet'`: lo cubre `offline.spec.ts`, que debe seguir verde con el registro manual.

- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/unit/app/router.test.ts` y `pnpm test:e2e -- publico offline`. Expected: FAIL en las nuevas.

- [ ] **Step 3: Implement** lo listado en Files.
  - **Si el build sigue inyectando el manifiesto en `publico.html`:** un plugin `transformIndexHtml` con `order: 'post'` lo quita solo de esa entrada. Se anota como Ruling.

- [ ] **Step 4: Run** lo mismo más `pnpm test:e2e` completo. Expected: PASS (todas, también `offline.spec.ts`).

- [ ] **Step 5: Commit** `feat(publico): sin internet con su propio Service Worker; la app no la toma [RF-73]`.

### Task 6: Bots, buscadores y servidor

**Files:**
- Modify: `public/.htaccess`, `public/robots.txt`
- Test: `tests/unit/publicFiles.test.ts`

**Interfaces:**
- **Produce:** las reglas que la prueba manual tras el despliegue comprueba con `curl` (ver Task 7).

- [ ] **Step 1: Write the failing tests.** Leen los dos archivos como texto. Las listas `AI_BOTS` y `PREVIEW_BOTS` se copian de Global Constraints dentro de la prueba.
  - **`'el .htaccess bloquea con 403 a cada bot de IA'`:** cada nombre de `AI_BOTS` está en una `RewriteCond %{HTTP_USER_AGENT}` seguida de `RewriteRule ^ - [F,L]`. Esa regla va **antes** del rewrite de `/anuncios/publico`.
  - **`'el .htaccess sirve /anuncios/publico con publico.html antes del fallback del SPA'`:** el índice de `RewriteRule ^anuncios/publico/?$ /publico.html [L]` es menor que el de `RewriteRule . /index.html`.
  - **`'X-Robots-Tag noindex en todo salvo la página pública'`:** hay un `Header set X-Robots-Tag "noindex, nofollow"` con una `expr` que excluye `^/(anuncios/publico/?|publico\.html|og-publico\.png)$`.
  - **`'robots.txt'`:** se parsea en grupos por `User-agent`.
    - **Googlebot y Bingbot:** `Allow: /anuncios/publico`, `Allow: /publico.html`, `Allow: /assets/`, `Allow: /og-publico.png` y `Disallow: /`.
    - **Robots de vista previa:** cada uno de `PREVIEW_BOTS` tiene `Allow: /anuncios/publico`, `/publico.html`, `/og-publico.png` y `Disallow: /`.
    - **Bots de IA:** cada uno de `AI_BOTS`, más `Google-Extended`, tiene `Disallow: /` sin ningún `Allow`.
    - **`*`:** `Disallow: /`.

- [ ] **Step 2: Run** `pnpm vitest run --project unit tests/unit/publicFiles.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **`.htaccess`:** el bloqueo por User-Agent (`[NC]`) va antes de todo y luego el rewrite público. El `Header set X-Robots-Tag … "expr=%{REQUEST_URI} !~ m#…#"` va dentro de `<IfModule mod_headers.c>`.
  - **`robots.txt`:** los grupos con un comentario de cabecera que explica la política.

- [ ] **Step 4: Run.** Expected: PASS.

- [ ] **Step 5: Commit** `feat(publico): Google y Bing sí, bots de IA no; vista previa en las redes [§8.6]`.

### Task 7: Imagen "A", botón en Inicio y documentación

**Files:**
- Create: `scripts/og-publico-template.html`, `public/og-publico.png` (generado), `src/features/home/ShareNoticesButton.vue`
- Modify: `scripts/marca.mjs`, `src/features/home/HomePage.vue`, `README.md`, `HANDOFF.md`, `index.html` (el comentario de la línea 8 ya no dice "lectura")
- Test: `tests/browser/features/share-notices.test.ts`

**Interfaces:**
- **Consume:** `useSync()` (`src/data/sync/useSync.ts`).
- **Produce:** `ShareNoticesButton.vue`, sin props.
  - **Enlace:** `${location.origin}/anuncios/publico`.
  - **Al pulsar:**
    - si existe `navigator.share`, lo llama con `{ title: 'Anuncios · Mansedumbre II', url }`; un `AbortError` se ignora;
    - si no, `navigator.clipboard.writeText(url)` y muestra "Enlace copiado" en una región `aria-live="polite"`;
    - si eso también falla, muestra el enlace como texto seleccionable.
  - **Al lado:** el enlace "Ver", con `target="_blank"` y `rel="noopener"`.

- [ ] **Step 0: Mockup y aprobación.** Se muestran dos cosas:
  - la imagen "A" a 1200×630 y cómo se ve como vista previa de WhatsApp;
  - el botón "Compartir los anuncios" con "Ver" en Inicio, en móvil y en escritorio.

  **Se espera el visto bueno del responsable.**

- [ ] **Step 1: Write the failing tests.**
  - **`'sin nube no hay botón'`:** con `mountApp('/', db)` en los tests sin nube, `byLabel(host,'Compartir los anuncios')` es `null`.
  - **`'con nube y share: llama a share con la URL pública'`:** se monta `ShareNoticesButton` con un contexto de sync simulado no nulo, usando el mismo patrón de inyección que `settings.test.ts` con `TeamSection`. Se espía `navigator.share` y se espera `{ title: 'Anuncios · Mansedumbre II', url: location.origin + '/anuncios/publico' }`.
  - **`'sin share: copia y dice Enlace copiado'`.**
  - **`'el enlace Ver abre /anuncios/publico en otra pestaña'`.**

- [ ] **Step 2: Run** `pnpm vitest run --project browser tests/browser/features/share-notices.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **El botón:** `ShareNoticesButton`, puesto en `HomePage` bajo `NextPresentationCard`, con `v-if` según la nube.
  - **La plantilla de la imagen** (`scripts/og-publico-template.html`, 1200×630):
    - fondo crema `#f3f0d6` y texto `#1a1a1a`;
    - "Anuncios" en Instrument Serif grande;
    - "MANSEDUMBRE II · IASD" en monoespaciada con espaciado, como `.meta` de `og-template.html`;
    - la hoja del ícono: `marca.mjs` cambia `<!-- icono: lo añade marca.mjs -->` por el SVG de `public/icon.svg`.
  - **`marca.mjs`:** hace una segunda captura a `public/og-publico.png`.
  - **Generar la imagen:** se corre `pnpm marca` y se revisa la imagen a ojo.
  - **Documentación:**
    - en README, la sección "Anuncios públicos": qué muestra, la casilla, el botón y la política de bots;
    - en HANDOFF, el estado, la siguiente tarea (los íconos de ayuda con tooltip en cada campo, ya pedida) y una fila en el registro;
    - en la sección de problemas abiertos de HANDOFF, la comprobación manual tras el despliegue:
      - una vista previa del enlace en WhatsApp;
      - `curl -A GPTBot -I https://anunciosm2.jose-web.com/anuncios/publico` → 403;
      - `curl -A Googlebot -I …` → 200 sin `X-Robots-Tag`;
      - `curl -I https://anunciosm2.jose-web.com/` → `X-Robots-Tag: noindex, nofollow`;
      - la Inspección de URL de Search Console muestra las tarjetas.

- [ ] **Step 4: Run** `pnpm test`, `pnpm typecheck` y `pnpm test:e2e`. Expected: todo PASS.

- [ ] **Step 5: Commit** `feat(publico): imagen A, botón Compartir los anuncios y documentación [§11 paso 9, RF-72]`.

- [ ] **Step 6: Capturas finales y aprobación.** Se toman capturas de la página pública, Inicio y el editor, a 375 px y en escritorio, en claro y en oscuro.
  - **Dónde quedan:** las capturas se guardan solo en local.
  - **Qué se espera:** el visto bueno del responsable antes de la revisión final y de unir la rama a master.

---

## Tareas 8–12: privacidad, interruptor y migraciones (spec §6, mockup aprobado 2026-11-05)

Mockup aprobado: `.superpowers/sdd/2026-11-05-fase1-p9-anuncios-publicos/mockup-p9-privacidad.html`.

### Task 8: Campos con audiencia y contacto en dos campos
- **Archivos:** `src/slides/types/fields.ts`, `src/slides/types/definitions.ts`, `src/slides/normalize.ts`, `src/features/announcements/editor/form/FieldControl.vue`, `src/public-notices/cards.ts`.
- **Tipos en `FieldDef`:**
  - `audience?: 'slides'` (se proyecta, nunca sale en la página pública);
  - `fallbackFor?: string` (sale en la slide solo si el campo nombrado está vacío);
  - `hint?: string` (lo muestra `UiField`, vía FieldControl).
- **Contacto, en Salida, Obra misionera, Actividad y Aviso:**
  - **`contacto`:**
    - etiqueta "Contacto privado";
    - `audience: 'slides'`;
    - ayuda "Sale en las slides. Nunca en la página pública.".
  - **`contactoPublico`, justo después:**
    - etiqueta "Contacto público";
    - kind `text`, role `secondary`, ícono `message-square`, `maxLength` 40;
    - `fallbackFor: 'contacto'`;
    - ayuda "Sale en la página pública, y en la slide si no hay contacto privado.";
    - placeholder o ejemplo "Habla con el Director de Jóvenes" (si el control acepta placeholder).
- **Culto:** `predicador` y `fotoPredicador` llevan `audience: 'slides'`; `predicador` lleva la ayuda "Solo en las slides. Nunca en la página pública.".
- **`normalize`:** omite un campo con `fallbackFor` si el campo nombrado tiene valor.
- **`cards`:** omite los campos con `audience: 'slides'`. Lo más simple es quitar esas claves de `values` antes de normalizar.
- **Pruebas:**
  - **Unit:**
    - `'contactoPublico sale en la slide solo sin contacto privado'`;
    - en cards, `'nunca muestra predicador ni contacto privado; sí el contacto público'`.
  - **Browser (editor):** las etiquetas "Contacto privado" y "Contacto público" con sus ayudas.
- **Commit:** `feat(privacidad): contacto privado y público; el predicador solo en las slides [RF-72]`.

### Task 9: Migración v2 de `public_notices` (sin PII y con interruptor)
- **Archivo:** `supabase/migrations/20261105010000_anuncios_publicos_privacidad.sql`, con `create or replace` de `public._public_notices_at`. La migración ya aplicada no se toca.
- **`values`:** se les quitan `predicador`, `fotoPredicador` y `contacto`.
- **Respuesta:** agrega `enabled`, que es `false` si `settings.data->>'publicPage' = 'equipo'`; en ese caso `notices` es `[]`.
- **Pruebas** (`tests/unit/db/publicNotices.test.ts`):
  - **La lista se deriva de las definiciones:** las claves con `audience: 'slides'` o `kind: 'image'` de los tipos publicables no aparecen en `values`, y `contactoPublico` sí.
  - **Interruptor:** `'con publicPage equipo: enabled false y sin anuncios'`.
- **Commit:** `feat(nube): public_notices sin datos personales y con interruptor [§8.5]`.

### Task 10: Interruptor en Configuración, página apagada e Inicio
- **Ajuste nuevo:** `Settings.publicPage: 'todos' | 'equipo'`, con `DEFAULT_SETTINGS.publicPage = 'todos'`.
- **Configuración:** `src/features/settings/PublicPageSection.vue`, con `SettingsSection id="pagina-publica"`, título "Página pública" y `UiChoiceGroup` "Quién ve los anuncios" ("Para todos" / "Solo el equipo"). La ayuda dice: 'Con "Solo el equipo", el enlace de la congregación dice que los anuncios no están disponibles.' La sección va después de Textos y el índice gana la entrada "Página pública".
- **Página pública:**
  - **Carga:** `load.ts` acepta `enabled` (opcional; si falta, cuenta como `true`). Con `false`, borra `CACHE_KEY` y devuelve `{ kind: 'disabled' }`.
  - **Mensaje:** "Los anuncios no están disponibles por ahora.".
- **Inicio:** `ShareNoticesButton` se oculta si `publicPage === 'equipo'`. Lee el ajuste con `useLiveQuery(loadSettings)`.
- **Pruebas:**
  - **Unit (`load`):** `disabled` borra la caché.
  - **Browser:** la página apagada, la sección de Configuración que guarda `publicPage`, y que Inicio no muestre "Compartir" con `'equipo'`.
- **Commit:** `feat(publico): interruptor de la página pública en Configuración [RF-110, RF-72]`.

### Task 11: Aviso en el editor
- **Cambio:** en `SlideOptions.vue`, la ayuda bajo "Mostrar al público" pasa a "Sale en la página que se comparte con la congregación. No escribas nombres ni teléfonos de personas.".
- **Prueba:** una más en `public-toggle.test.ts`.
- **Commit:** `feat(privacidad): aviso de no escribir nombres ni teléfonos [RF-72]`.

### Task 12: Migraciones automáticas en el despliegue
- **`supabase/config.toml` mínimo:** `project_id = "anuncios"`, si la CLI lo pide.
- **`.github/workflows/deploy.yml`:** después de las pruebas y antes de "Subir a Hostinger", agrega `supabase/setup-cli@v1` y el paso "Migraciones de Supabase":
  - **Secretos:** comprueba `SUPABASE_ACCESS_TOKEN` y `SUPABASE_DB_PASSWORD`.
  - **Comandos:**
    - `supabase link --project-ref "${SUPABASE_PROJECT_REF:-jyxhnqbqzqrbahorigxq}"`;
    - `supabase migration repair --status applied 20261103000000 20261105000000`, para las aplicadas a mano (si ya están registradas, no cambia nada);
    - `supabase db push`.
- **Prueba** (`tests/unit/deployWorkflow.test.ts`):
  - el paso de migraciones va antes de la subida por FTP;
  - nombra los dos secretos;
  - `repair` lista exactamente esas dos versiones.
- **README y HANDOFF:** cómo crear los dos secretos. El token se crea en supabase.com/dashboard/account/tokens con la cuenta de la iglesia; la contraseña está en Project Settings → Database.
- **Commit:** `ci(despliegue): aplicar las migraciones de Supabase antes de publicar [§8.6]`.

### Task 13: Vista del equipo en la página pública (spec §6.5)
- **Migración** `supabase/migrations/20261105020000_vista_equipo.sql`: `public._team_notices_at(p_now)` (interna, sin grant a anon/authenticated) y `public.team_notices()` (`security definer`, `search_path = ''`, grant solo a `authenticated`; `raise exception` si no es editor). Mismo filtro que la pública, sin quitar `predicador`/`contacto` (sí `fotoPredicador`) y sin mirar `publicPage`.
- **`src/public-notices/session.ts`:** `teamToken(storage, supabaseUrl, nowMs): string | null` lee `sb-<ref>-auth-token`; `null` si falta, no se entiende o `expires_at * 1000 <= nowMs`.
- **`load.ts`:** con token, primero `rpc/team_notices` con `Authorization: Bearer`; si va bien, `team: true` en el estado y caché en `TEAM_CACHE_KEY = 'anuncios-equipo:v1'`; si falla por red, la copia del equipo; si responde error (401/403/4xx), la vista pública. Sin token, la pública de siempre.
- **`cards.ts`:** `noticeCards(data, { team })`; con `team`, no quita los campos `audience: 'slides'` y muestra también el contacto público.
- **`PublicNoticesApp.vue`:** `TeamBanner` (`role="note"`, candado 16 px, 14 px) bajo el encabezado si `state.team`.
- **Pruebas:**
  - **DB:** anon no puede llamar `team_notices`; un no editor recibe error; un editor ve `predicador` y `contacto`, y los ve también con `publicPage = 'equipo'`.
  - **Unit:** `teamToken` (falta, vencida, válida); `load` (equipo bien, 403 → pública, sin red → copia del equipo, sin token nunca lee la copia del equipo); `cards` con `team`.
  - **Browser:** la franja aparece solo con `team`.
- **Commit:** `feat(publico): vista del equipo con nombres y contactos privados [RF-72]`.
