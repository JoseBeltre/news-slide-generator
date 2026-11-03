# P6 · Presentar: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paso 7 de SRS §11. El sábado se presenta desde la laptop, sin internet:
- **la vista del presentador** controla lo que se ve. Muestra la slide actual y la siguiente, los puntos clave, las notas, "3 de 9", la hora y la tira de miniaturas;
- **la ventana pública** está en las pantallas. Muestra solo la slide, sin controles y sin cursor;
- las dos ventanas se sincronizan con `BroadcastChannel`;
- teclado y clicker funcionan en cualquiera de las dos;
- hay pantalla negra y pantalla de logo;
- si la ventana pública se cierra, se reabre en la misma slide;
- hay un modo de una sola ventana como respaldo.

**Architecture:**
- **Reglas puras:** en `src/data/presenting.ts` están el estado, los comandos, las teclas y los puntos clave.
- **Canal:** en `src/data/presentationChannel.ts`. Envuelve `BroadcastChannel('presentacion')`, tiene mensajes tipados y la fábrica del canal se puede inyectar (pruebas).
- **Pantallas:** van en una funcionalidad nueva, `src/features/presenting/`, que reutiliza `presentations/shared/` (registro, slides, contexto).
- **Rutas:** las tres rutas nuevas llevan `meta.bare`. Sin el encabezado ni los márgenes de la app, la pantalla queda limpia.
- **La ventana pública es "tonta":**
  - lee la presentación de Dexie y monta **todas** las slides apiladas;
  - cambiar de slide solo cambia la opacidad de cada una (fundido ≤ 300 ms). Así se cumple RNF-04 (< 100 ms) sin volver a dibujar.
- **El presentador es la fuente del estado.** La ventana pública le envía las teclas como comandos y él responde con el estado.

**Tech Stack:** el mismo de P1–P5, sin dependencias nuevas.
- Comunicación: `BroadcastChannel`, `window.open`.
- Pantalla completa: Fullscreen API.
- Window Management API (`getScreenDetails`), solo como mejora opcional.

**Spec:** `SRS.md` v1.5:
- §3.8: RF-60…RF-68 (RF-69, el modo bucle, es F2 y no entra);
- §4: RNF-04 y RNF-06;
- §8.2: las slides son un solo componente;
- §8.3: `window.open('/publica')`, y los mensajes `goto`, `black`, `logo` y `state`;
- §10.1: criterios 1–3.

Hoja de ruta: `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md` (P6). Diseño de la interfaz: `DESIGN.md`.

Lo que consume de P3–P5:
- `SlideView`, `presentationSlides`, `presentationContext` y `contentIssues`;
- de `presentations/shared/`: `usePresentationRecord`, `usePresentationSlides`, `SlideThumbnails` y `SlideThumb`;
- `logoCandidatesFor` y `selectLogoVariant`;
- `normalizeAnnouncement` (a través de las `SlideSpec`);
- `useShortcut` y los controles `Ui*`.

## Global Constraints

Se aplican **todas las de P4 y P5** sin cambios: HANDOFF, pnpm, Tailwind estricto, tamaños de archivo, nada duplicado, `cursor-pointer` en los botones, imports entre funcionalidades solo desde `shared/`, offline, español, commits y push. Además:

- **Ventana pública (RF-61):**
  - ningún control visible, `cursor-none`, fondo negro y la slide escalada a 16:9 con bandas negras;
  - la única excepción es el aviso "Haz clic aquí para pantalla completa" antes del primer clic. Desaparece con ese clic y nunca vuelve mientras está en pantalla completa.
- **Teclas (RF-64)**, con cualquiera de las dos ventanas enfocada:
  - `→`, `↓`, `Espacio`, `PageDown` = siguiente;
  - `←`, `↑`, `PageUp` = anterior;
  - `Inicio`/`Fin` = primera/última;
  - `B` = pantalla negra (alterna);
  - `L` = pantalla de logo (alterna; la propone el plan para RF-62);
  - `Esc` = salir: en el presentador vuelve a la presentación y cierra la ventana pública; en la pública solo sale de pantalla completa.
- **RNF-04:** el cambio de slide entre ventanas tarda < 100 ms. Se mide en la E2E y se escribe en el registro.
- **Fundido (RF-68):** opacidad 300 ms. Con `prefers-reduced-motion`, sin transición (`motion-reduce:transition-none`).
- **Mensajes (§8.3):** `goto(index)`, `black(on)`, `logo(on)` y `state`. Se agregan `hello` (la pública acaba de abrir y pide el estado) y `command` (una tecla pulsada en la pública). Todos llevan `presentationId`, y los de otra presentación se ignoran.
- **Presentar se bloquea** si `contentIssues` da `vacia`, `eliminado`, `borrador` o `no_cabe`. "Presentar" queda deshabilitado y se muestra el primer problema con `issueMessage`. Mientras las slides se miden (`midiendo`), no se bloquea.
- **Vista del presentador:** siempre en oscuro (`scheme-dark` en su raíz; los tokens con `light-dark()` lo resuelven solos), con textos grandes. El atajo global `N` (nuevo anuncio) no actúa en las rutas `bare`.

## Review Focus

- **Ventana pública cerrada y reabierta** → vuelve a la misma slide, con negro o logo si estaban activos. Prueba: Task 4 y E2E.
- **La pública abre antes de que el presentador tenga datos, o sin presentador** (alguien abre `/publica/:id` a mano) → pide el estado, muestra negro mientras no llega y nunca muestra "undefined". Prueba: Task 3.
- **Una presentación de otra pestaña o de otro día en el mismo canal** → sus mensajes se ignoran. Prueba: Task 2.
- **Una tecla en un campo** (por ejemplo, el buscador del navegador) → no avanza; las teclas con Ctrl o Alt tampoco. Prueba: Task 1.
- **Saltar a una slide de cumpleaños de varias páginas o a la portada** → los puntos clave muestran lo de esa slide (nombres, "Portada"), nunca los del anuncio anterior. Prueba: Task 1.

---

## Estructura de archivos

```
src/
  data/
    presenting.ts           # puro: PresenterState, apply(state, command, total), commandForKey(event), keyPoints(slide, byId)
    presentationChannel.ts  # BroadcastChannel('presentacion') tipado; fábrica inyectable
  app/
    App.vue                 # meta.bare → sin AppHeader ni márgenes; N desactivado
    router.ts               # + 'presentar', 'publica', 'una-ventana' (bare)
  features/
    presentations/detail/
      PresentPanel.vue      # "Presentar" + "Una sola ventana", bloqueados con el motivo (RF-10)
    presenting/
      shared/
        SlideStage.vue      # todas las slides apiladas, fundido, negro y logo; 16:9 a pantalla completa
        LogoScreen.vue      # logo de la iglesia en blanco, centrado sobre negro
        usePresentingData.ts   # presentación + slides con su contexto (para presentar)
        useCommandKeys.ts      # teclas → comandos (commandForKey) en esta ventana
      presenter/
        PresenterPage.vue      # compone; ≤ 80 líneas
        usePresenter.ts        # estado, canal, ventana pública (abrir, reabrir, cerrada), Esc
        usePublicWindow.ts     # window.open, estado de cerrada, Window Management API opcional
        CurrentAndNext.vue     # slide actual grande + siguiente pequeña
        KeyPoints.vue          # puntos clave en texto grande + notas
        PresenterBar.vue       # anterior/siguiente, negro, logo, "3 de 9", hora, pantalla pública
        Filmstrip.vue          # tira de miniaturas; clic = saltar
        useClock.ts            # hora actual "7:42 p. m."
      public/
        PublicPage.vue         # escucha el canal; hello al abrir; teclas → command; cursor-none
        FullscreenHint.vue     # "Haz clic aquí para pantalla completa" (solo antes del primer clic)
      single/
        SingleWindowPage.vue   # SlideStage a pantalla completa + estado local + teclas (RF-66)
```

---

### Task 1: Reglas para presentar

**Files:**
- Create: `src/data/presenting.ts`, `tests/unit/data/presenting.test.ts`.

**Interfaces:**
- Consumes:
  - `PresentationSlide` (P5);
  - `displayTitle`;
  - `Announcement`;
  - `SlideSpec` (P3).
- Produces:
  ```ts
  export interface PresenterState { index: number; black: boolean; logo: boolean }
  export const INITIAL_STATE: PresenterState   // { index: 0, black: false, logo: false }
  export type Command =
    | { type: 'next' } | { type: 'prev' } | { type: 'first' } | { type: 'last' }
    | { type: 'goto'; index: number } | { type: 'black' } | { type: 'logo' } | { type: 'exit' }
  export function apply(state: PresenterState, command: Command, total: number): PresenterState
  //   índices acotados a [0, total-1] (total 0 → 0); next/prev/goto quitan negro y logo;
  //   black alterna y apaga logo; logo alterna y apaga negro; exit no cambia el estado
  export function commandForKey(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey'>, inField: boolean): Command | undefined
  export interface KeyPoints { heading: string; lines: string[]; notes?: string; label: string }   // label: "Portada", tipo, etc.
  export function keyPoints(slide: PresentationSlide | undefined, byId: ReadonlyMap<string, Announcement>): KeyPoints
  ```
  Contenido de `keyPoints` según la slide:
  - **`announcement`:** título y filas con `role: 'key'` (fecha, hora, lugar, precio).
  - **`birthday-single`:** el nombre y su `dayText`.
  - **`birthday-group`:** los nombres; con `page`, `label` = "Cumpleaños (1/2)".
  - **`image`:** el título interno o "Imagen".
  - **`cover` / `closing`:** "Portada" / "Cierre", sin notas.
  - Las notas son `presenterNotes` del anuncio.
  - Sin slide: heading "Sin slides".

- [ ] **Step 1: pruebas que fallan.**
  - **`apply`:**
    - `next` en la última se queda;
    - `prev` en 0 se queda;
    - `goto(99)` con 5 → 4;
    - `goto(-1)` → 0;
    - `total` 0 → `index` 0;
    - `black` dos veces → apagado;
    - `logo` con negro activo → logo sí, negro no;
    - `next` con negro activo → avanza y quita el negro.
  - **`commandForKey`:**
    - las 11 teclas de RF-64 más `L`, en mayúscula y en minúscula;
    - `Ctrl+→` → undefined;
    - una tecla con `inField` → undefined, salvo `Esc`;
    - `x` → undefined.
  - **`keyPoints`:**
    - un culto da su título y "Sábado 7 de noviembre · 7:00 p. m." (las filas `key`) y sus notas;
    - cumpleaños de grupo en la página 2 de 2 → `label` "Cumpleaños (2/2)" con sus nombres;
    - portada → "Portada" sin notas;
    - `undefined` → "Sin slides".
- [ ] **Step 2:** `pnpm vitest run presenting` → FAIL.
- [ ] **Step 3: implementar.** Funciones puras, sin Vue.
- [ ] **Step 4:** PASS; commit `feat(datos): reglas para presentar: estado, teclas y puntos clave [RF-62, RF-63, RF-64]`.

### Task 2: Canal entre ventanas

**Files:**
- Create: `src/data/presentationChannel.ts`, `tests/unit/data/presentationChannel.test.ts`, `tests/browser/data/presentationChannel.test.ts`.

**Interfaces:**
- Consumes: `PresenterState`, `Command`.
- Produces:
  ```ts
  export type ChannelMessage =
    | { type: 'state'; state: PresenterState }
    | { type: 'goto'; index: number } | { type: 'black'; on: boolean } | { type: 'logo'; on: boolean }
    | { type: 'hello' } | { type: 'command'; command: Command }
  export interface PresentationChannel {
    send(message: ChannelMessage): void
    onMessage(handler: (m: ChannelMessage) => void): () => void   // devuelve "dejar de escuchar"
    close(): void
  }
  export const CHANNEL_NAME = 'presentacion'
  export function openPresentationChannel(presentationId: string,
    create?: (name: string) => Pick<BroadcastChannel, 'postMessage' | 'close' | 'addEventListener' | 'removeEventListener'>): PresentationChannel
  //   envía { presentationId, ...message }; descarta mensajes de otra presentación o mal formados
  ```
- [ ] **Step 1: pruebas que fallan.**
  - **Unit, con un canal falso en memoria:**
    - `send` llega al otro extremo sin `presentationId`;
    - un mensaje de otra presentación se ignora;
    - `{}` o un `type` desconocido se ignoran;
    - después de `close`, no llega nada.
  - **Navegador, con `BroadcastChannel` real:** dos canales de la misma presentación se hablan; `goto` llega en < 50 ms.
- [ ] **Step 2:** FAIL → implementar. Los mensajes se validan con un `switch` sobre `type`, sin Zod: son pocos y son nuestros.
- [ ] **Step 3:** PASS; commit `feat(datos): canal entre ventanas de la presentación [RF-60]`.

### Task 3: Marco "bare", escenario de slides y ventana pública

**Files:**
- Create:
  - `src/features/presenting/shared/SlideStage.vue`, `LogoScreen.vue`, `usePresentingData.ts`, `useCommandKeys.ts`;
  - `src/features/presenting/public/PublicPage.vue`, `FullscreenHint.vue`;
  - `tests/browser/features/presenting-public.test.ts`.
- Modify:
  - `src/app/router.ts`: `/publica/:id` → `publica` (`meta: { bare: true }`);
  - `src/app/App.vue`: sin encabezado ni márgenes con `meta.bare`; `N` no actúa.

**Interfaces:**
- Consumes:
  - `usePresentationRecord` y `usePresentationSlides` (P5 shared);
  - `apply`, `commandForKey`, `INITIAL_STATE`;
  - `openPresentationChannel`;
  - `logoCandidatesFor`, `selectLogoVariant`.
- Produces:
  ```ts
  // SlideStage: props { slides: PresentationSlide[]; ctx: SlideContext; state: PresenterState }
  //   todas montadas en un 16:9 centrado sobre negro; la actual opacity-100, las demás opacity-0 (aria-hidden);
  //   data-index en la raíz = state.index; negro o LogoScreen encima con el mismo fundido
  export function usePresentingData(id: Ref<string>): { presentation; slides; ctx; byId; total: Ref<number>; missing }
  export function useCommandKeys(onCommand: (c: Command) => void): void   // keydown en window, usa commandForKey
  ```
- **`PublicPage`:**
  - al montar envía `hello` y arranca en negro hasta recibir el primer `state`;
  - aplica `state`, `goto`, `black` y `logo` sin calcular nada más;
  - las teclas salen como `command` (salvo `Esc`, que solo sale de pantalla completa);
  - raíz `fixed inset-0 bg-black cursor-none`;
  - el primer clic pide `requestFullscreen()` y oculta `FullscreenHint`.
- [ ] **Step 1: pruebas que fallan** (montar `/publica/:id` con un canal falso inyectado por `provide`; la clave la exporta `presentationChannel.ts`).
  - No hay encabezado de la app ni ningún `button` visible fuera del aviso.
  - Al abrir envía `hello` y muestra negro (`data-black`).
  - `state {index: 2}` → `data-index="2"`, y solo la slide 2 tiene `opacity-100`.
  - `black on` → la capa negra visible; `logo on` → el `img` del logo de la iglesia en blanco.
  - `→` en la pública → envía `command {type:'next'}` y **no** cambia sola de slide.
  - Un id inexistente → negro, sin texto.
  - La raíz tiene `cursor-none`.
  - Con `matchMedia('(prefers-reduced-motion: reduce)')`, la clase `motion-reduce:transition-none` está presente.
- [ ] **Step 2:** FAIL → implementar. `N` en `App.vue`: `useShortcut('n', …)` comprueba `route.meta.bare`.
- [ ] **Step 3:** PASS; arquitectura PASS; commit `feat(presentar): ventana pública sin controles, con fundido, negro y logo [RF-61, RF-68]`.

### Task 4: Vista del presentador

**Files:**
- Create:
  - `src/features/presenting/presenter/PresenterPage.vue`, `usePresenter.ts`, `usePublicWindow.ts`, `CurrentAndNext.vue`, `KeyPoints.vue`, `PresenterBar.vue`, `Filmstrip.vue`, `useClock.ts`;
  - `tests/browser/features/presenting-presenter.test.ts`.
- Modify: `src/app/router.ts`: `/presentaciones/:id/presentar` → `presentar` (bare).

**Interfaces:**
- Consumes: Task 1–3; `SlideThumbnails`/`SlideThumb` (P5 shared) para la tira.
- Produces:
  ```ts
  export function usePublicWindow(url: Ref<string>, opener?: (url: string) => Window | null): {
    isOpen: Readonly<Ref<boolean>>   // comprueba `closed` cada 1 s
    open(): Promise<void>            // con Window Management API, en la otra pantalla si se puede; si no, window.open normal
    close(): void
  }
  export function usePresenter(id: Ref<string>): {
    state: Readonly<Ref<PresenterState>>; run(c: Command): void; publicWindow: ReturnType<typeof usePublicWindow>
  }
  //   run aplica `apply`, guarda el estado y lo envía como 'state'; responde 'hello' con 'state';
  //   recibe 'command' de la pública y lo ejecuta; 'exit' cierra la pública y vuelve a 'presentacion'
  export function useClock(): Readonly<Ref<string>>   // formatTime de la hora local, cada 15 s
  ```
- **Pantalla:**
  - **Arriba:** la slide actual grande y la siguiente pequeña (con "Fin" si no hay más).
  - **A la derecha:** los puntos clave en texto grande (`text-display-sm`) y las notas.
  - **Abajo, `PresenterBar`:**
    - "Anterior" y "Siguiente";
    - "Negro (B)" y "Logo (L)", con `aria-pressed`;
    - "3 de 9" y la hora;
    - "Abrir pantalla pública", o "Reabrir pantalla pública" si está cerrada. Junto al botón, las instrucciones: "Mueve la ventana a las pantallas y haz clic en ella para pantalla completa."
  - **Tira de miniaturas:** la actual marcada con un borde; clic = `goto`.
  - Siempre en oscuro (`scheme-dark`).
- [ ] **Step 1: pruebas que fallan.** Usan un canal falso y un `opener` falso que devuelve `{ closed: false, close() }`.
  - "Siguiente" → envía `state {index:1}` y la vista muestra "2 de N".
  - Clic en la miniatura 3 → `index 2`.
  - Llega un `command next` → avanza.
  - Llega `hello` → responde con el estado actual.
  - "Negro" → `aria-pressed="true"` y `state.black`.
  - Los puntos clave de un culto muestran su título, fecha y hora, y sus notas.
  - Con el `opener` en `closed: true` → aparece "Reabrir pantalla pública"; al pulsarlo se abre `/publica/:id`, y su `hello` recibe el mismo índice.
  - `Esc` → cierra la pública y vuelve a la presentación.
  - La raíz tiene `scheme-dark`.
- [ ] **Step 2:** FAIL → implementar.
  - `usePublicWindow` usa `getScreenDetails` solo si existe. Si falla o la deniegan (por ejemplo Brave), abre normal sin avisar del error: el flujo manual es el principal (RF-65).
  - Se abre con `window.open(url, 'pantalla-publica', 'popup')`; con un nombre fijo, "Reabrir" reutiliza la misma ventana.
- [ ] **Step 3:** PASS; arquitectura PASS (la página ≤ 80 líneas); commit `feat(presentar): vista del presentador con slide actual y siguiente, puntos clave, notas y miniaturas [RF-62, RF-63, RF-65, RF-67]`.

### Task 5: Modo de una sola ventana y botones "Presentar"

**Files:**
- Create:
  - `src/features/presenting/single/SingleWindowPage.vue`;
  - `src/features/presentations/detail/PresentPanel.vue`;
  - `tests/browser/features/presenting-single.test.ts`.
- Modify:
  - `src/app/router.ts`: `/presentaciones/:id/una-ventana` → `una-ventana` (bare);
  - `PresentationPage.vue`: `PresentPanel` encima de `PreparePanel`.

**Interfaces:**
- Consumes: `SlideStage`, `useCommandKeys`, `apply`, `contentIssues`, `issueMessage`.
- `PresentPanel`:
  - props: `{ presentationId: string; issues: ContentIssue[] }`;
  - "Presentar" (principal) navega a `presentar`; "Una sola ventana" (secundario) navega a `una-ventana`;
  - los dos están deshabilitados si hay algún problema que no sea `midiendo`, y debajo se muestra `issueMessage` del primero.
- [ ] **Step 1: pruebas que fallan.**
  - **`/una-ventana`:**
    - `→` avanza (`data-index`);
    - `B` pone negro;
    - `Fin` va a la última;
    - `Esc` vuelve a la presentación;
    - no hay ningún botón visible fuera del aviso de pantalla completa;
    - la raíz tiene `cursor-none`.
  - **En la presentación:**
    - con un anuncio en borrador, "Presentar" está deshabilitado y se lee "«…» está incompleto.";
    - con todo bien, "Presentar" navega a `presentar`.
- [ ] **Step 2:** FAIL → implementar.
- [ ] **Step 3:** PASS; commit `feat(presentar): modo de una sola ventana y botón Presentar con bloqueo [RF-10, RF-66]`.

### Task 6: Flujo completo con dos ventanas sin red y verificación

**Files:**
- Create: `tests/e2e/presentar.spec.ts`.
- Modify: `HANDOFF.md`, hoja de ruta (estado de P6).

- [ ] **Step 1: E2E** contra el build, sin red (`goOffline`).
  - **Preparar:** se crean 2 anuncios y la presentación del sábado; "Presentar" abre el presentador.
  - **Abrir la pública:** "Abrir pantalla pública" → `context.waitForEvent('page')` da la ventana pública.
  - **Controlar desde el presentador:**
    - `→` → `data-index="1"` en la pública. El tiempo entre la tecla y el cambio, medido con `performance.now()` en las dos páginas, se escribe en el registro y debe ser < 100 ms (RNF-04).
    - `B` → negro en la pública.
  - **Controlar desde la pública:** `→` → avanzan las dos.
  - **Reabrir:** se cierra la pública; "Reabrir pantalla pública" la abre en el mismo índice.
  - **Una sola ventana:** `→` y `Esc` funcionan.
  - **Sin controles:** en la ventana pública, `page.locator('button:visible')` cuenta 0 después del primer clic.
- [ ] **Step 2: verificación completa.** Todo debe salir verde:
  - `pnpm typecheck`;
  - `pnpm test`;
  - `pnpm build`;
  - `pnpm test:e2e`.
- [ ] **Step 3: revisión a ojo.**
  - Presentador y pública en una laptop con 2 pantallas (o 2 ventanas), en Chrome.
  - Las capturas se quedan en local.
  - **Brave queda para el responsable** (RNF-06): se anota en HANDOFF como validación manual pendiente.
- [ ] **Step 4:** actualizar HANDOFF (estado, estructura `features/presenting/`, próximo paso: §11 paso 8, Supabase y sincronización local-first) y commit `test(presentar): dos ventanas sin red, teclado y reapertura [RF-60…RF-68, RNF-04, §10.1–3]`.
