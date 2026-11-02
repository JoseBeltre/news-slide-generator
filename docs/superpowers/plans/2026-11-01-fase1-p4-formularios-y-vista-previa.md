# P4 · Formularios y vista previa: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paso 5 de SRS §11: la app deja de ser un esqueleto. El equipo crea, edita, duplica, elimina y filtra anuncios desde el celular o la laptop, con un formulario generado desde los `FieldDef`, vista previa en vivo de la slide real y el aviso "No cabe" en el campo culpable. Todo funciona sin red.

**Architecture:** Rutas con `vue-router` (historial HTML5; el `.htaccess` de P1 ya redirige a `index.html`). Los datos viven en Dexie y la interfaz los lee con `liveQuery` envuelto en un composable; no hay Pinia (no hay estado de interfaz compartido que lo justifique). Las reglas de negocio (fecha del evento, activos/pasados, estado, duplicar) son funciones puras en `src/data/announcements.ts`, probadas sin navegador. El editor mantiene un **borrador reactivo** (`useAnnouncementDraft`) del que salen el formulario, la validación (`validateValues`) y la vista previa (`buildSlides` + `SlideView` de P3). El estilo de la interfaz sale de `DESIGN.md` (NDS Core adaptado) como variables CSS en `src/ui/tokens.css`, con CSS con alcance por componente; las slides no lo usan.

**Tech Stack:** Lo de P1–P3 + `vue-router` 4, `@fontsource/instrument-serif` y `@fontsource-variable/inter` (OFL). Gestor: **pnpm**.

**Spec:** `SRS.md` v1.5 (§2.1 usuarios de la interfaz, §3.1 RF-01…RF-10, §3.6 RF-42, §4 RNF-01, RNF-03, RNF-04, RNF-10, §6 pantallas 1–3, §7 `Announcement`). Diseño de la interfaz: `DESIGN.md`. Hoja de ruta: `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md` (P4). Lo que consume de P3: `buildSlides`, `templatesFor`, `paletteFor`, `SlideView` (estado `ok` / `no_cabe` / `midiendo`), `deriveTheme`, `PRESET_THEMES`, `SLIDE_STYLES`.

## Global Constraints

- **HANDOFF.md:** leerlo antes de cada tarea si no está en el contexto; actualizarlo al terminarla y añadirlo a su commit.
- **pnpm** para todo. Nunca npm.
- **Offline (C-03, RNF-01):** fuentes e íconos empaquetados y precacheados; ningún `fetch` ni CSS a otro origen. La E2E de P1 "sin orígenes externos" sigue pasando.
- **Usuarios de la interfaz (SRS v1.5 §2.1):** jóvenes y adultos con soltura tecnológica. Interfaz rápida y eficiente; nada "para principiantes". Contraste WCAG AA (4.5:1 texto, 3:1 bordes de campos), foco visible, todo usable con teclado y en el celular (zonas táctiles ≥ 44 px).
- **DESIGN.md manda en la interfaz; §5 manda en las slides.** Ningún token de `DESIGN.md` entra en `src/slides/`.
- **RNF-03:** un anuncio típico en ≤ 2 minutos. **RNF-04:** la vista previa se actualiza en < 200 ms al teclear.
- **RNF-10:** nunca "undefined", huecos ni íconos de imagen rota en la interfaz.
- **Textos de interfaz en español**, en el tono de `DESIGN.md` (cortos, dicen qué pasó y qué hacer). Identificadores en inglés.
- **Licencias:** anotar `vue-router` (MIT), Instrument Serif e Inter (OFL) en `LICENSES.md`.
- **Commits:** en español con IDs del SRS y `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Tras unir a `master`, `git push origin master`.

## Review Focus

- **Guardar mientras la slide está "midiendo"** (se teclea y se pulsa Ctrl+S al instante) → se guarda con el estado ya medido, nunca `listo` para una slide que no cabe. Prueba en Task 6.
- **Anuncio guardado con valores que ya no validan** (un tipo cambió o un dato quedó a medias) → el editor abre, muestra los errores en sus campos y deja corregir; nunca pantalla en blanco. Prueba en Task 6.
- **Salir del editor con cambios sin guardar** (otra ruta, recargar, cerrar la pestaña) → se pregunta antes de perderlos. Prueba en Task 6.
- **Activos y pasados** → un anuncio con fecha anterior a hoy aparece en "Pasados"; uno sin fecha (aviso) sigue en "Activos"; uno de hoy sigue activo. Prueba en Task 2.
- **Imágenes** → subir la misma foto dos veces no duplica; quitar la foto de un campo no borra el blob (puede usarla otro anuncio); un flyer de menos de 1280 px avisa sin bloquear (RF-42). Prueba en Task 5.

---

## Estructura de archivos

```
src/router.ts                         # rutas y guardas
src/App.vue                           # marco: encabezado, navegación, <RouterView>
src/ui/tokens.css                     # variables de DESIGN.md (claro/oscuro), base y foco
src/ui/fonts.ts                       # Instrument Serif + Inter empaquetadas
src/ui/components/                    # UiButton, UiField, UiBanner, UiConfirm, UiChoice
src/data/useDb.ts                     # una AppDb por app (provide/inject) + useLiveQuery
src/data/settings.ts                  # Configuración con valores por defecto (registro único)
src/data/announcements.ts             # reglas: eventDate, activos/pasados, filtros, duplicar, estado
src/views/HomeView.vue                # Inicio (SRS §6.1)
src/views/AnnouncementsView.vue       # lista con filtros (RF-08)
src/views/NewAnnouncementView.vue     # paso 1: tipo (RF-01)
src/views/EditorView.vue              # paso 2: formulario + vista previa (RF-03)
src/editor/useAnnouncementDraft.ts    # borrador reactivo, validación, estado, guardar
src/editor/fields/                    # un componente por FieldKind
src/editor/SlideOptions.vue           # plantilla, estilo, tema, color, logo, fecha
src/editor/PreviewPanel.vue           # SlideView(s) + estado "No cabe"
tests/unit/data/…  tests/browser/editor/…  tests/e2e/anuncios.spec.ts
```

---

### Task 1: Marco de la app, rutas y estilo de la interfaz

**Files:** Create `src/router.ts`, `src/ui/tokens.css`, `src/ui/fonts.ts`, `src/ui/components/UiButton.vue`, `src/views/HomeView.vue` (vacío por ahora), `tests/unit/router.test.ts`. Modify `src/App.vue`, `src/main.ts`, `package.json`, `LICENSES.md`, `vite.config.ts` (colores del manifiesto: `#F3F0D6` / `#1A1A1A`), `tests/e2e/offline.spec.ts`.

**Interfaces:**
- Produces:
  ```ts
  export const routes: RouteRecordRaw[]   // nombres: 'inicio' '/', 'anuncios' '/anuncios',
                                          // 'nuevo' '/anuncios/nuevo', 'nuevo-tipo' '/anuncios/nuevo/:typeId',
                                          // 'editar' '/anuncios/:id'
  export function createAppRouter(history?: RouterHistory): Router
  ```
- `tokens.css`: una variable por token de `DESIGN.md` (`--background`, `--surface`, `--muted`, `--ink`, `--ink-muted`, `--hairline`, `--field-border`, `--danger`, `--danger-bg`, `--success`, `--success-bg`, `--warning`, `--warning-bg`, `--accent`, `--radius-sm|md|lg`, `--font-display`, `--font-body`, `--font-meta`), tema oscuro con `@media (prefers-color-scheme: dark)` y con `[data-theme="dark"]`; `:focus-visible` con borde de 2 px `--ink` y anillo separado 2 px.

- [ ] **Step 1:** `pnpm add vue-router @fontsource/instrument-serif @fontsource-variable/inter`; anotarlos en `LICENSES.md`.
- [ ] **Step 2: pruebas que fallan** (`router.test.ts`, con `createMemoryHistory`): `/anuncios/nuevo/culto` resuelve a `nuevo-tipo` con `typeId 'culto'`; `/anuncios/nuevo/no-existe` redirige a `nuevo` (guarda `beforeEnter` con `getTypeDef`); `/anuncios/abc` resuelve a `editar` con `id 'abc'`; una ruta desconocida va a `inicio`.
- [ ] **Step 3:** `pnpm vitest run router` → FAIL.
- [ ] **Step 4:** implementar. `App.vue`: encabezado con el nombre de la app en `--font-display`, enlaces "Inicio" y "Anuncios", y `<RouterView>`. Las vistas se cargan con `import()` diferido salvo Inicio.
- [ ] **Step 5:** la E2E offline (`offline.spec.ts`) añade: sin red, `/anuncios` carga y las fuentes de la interfaz (`document.fonts.check('16px Inter Variable')` tras `document.fonts.load`) están disponibles.
- [ ] **Step 6:** `pnpm vitest run router` → PASS; `pnpm typecheck` → 0; `pnpm test:e2e --project chromium` → PASS.
- [ ] **Step 7:** commit `feat(app): rutas, marco y estilo de la interfaz (NDS Core) [§6, RNF-01]`.

### Task 2: Reglas de los anuncios y acceso a datos

**Files:** Create `src/data/announcements.ts`, `src/data/settings.ts`, `src/data/useDb.ts`, `tests/unit/data/announcements.test.ts`, `tests/unit/data/settings.test.ts`. Modify `src/data/local/repository.ts` (copia profunda al guardar), `src/data/local/db.ts` (versión 2: índice `updatedAt` en `settings`), `src/slides/types/validation.ts` (mensaje de precio no numérico).

**Interfaces:**
- Consumes: `createRepository`, `AppDb` (P2); `getTypeDef`, `validateValues` (P2).
- Produces:
  ```ts
  // announcements.ts (puro)
  export type AnnouncementView = 'activos' | 'pasados'
  export function eventDateOf(typeId: string, values: Record<string, unknown>): string | undefined
  //   'fecha' del tipo; en cumpleaños, undefined (no archivan por fecha)
  export function isPast(a: Pick<Announcement, 'eventDate'>, today: string): boolean   // eventDate < today
  export function filterAnnouncements(list: Announcement[], f: { view: AnnouncementView; typeId?: string; today: string }): Announcement[]
  //   activos: por eventDate ascendente (sin fecha al final); pasados: descendente
  export function draftFrom(typeId: AnnouncementTypeId, settings: Settings): NewRecord<Announcement>
  //   valores por defecto de los FieldDef, templateId por defecto del tipo, logo { kind: 'iglesia' }, status 'borrador'
  export function duplicate(a: Announcement, now: string): NewRecord<Announcement>   // sin id, status 'borrador', createdAt = now
  export function statusFor(valid: boolean, slide: SlideStatus['status']): Announcement['status']
  //   no válido → 'borrador'; válido + 'no_cabe' → 'no_cabe'; válido + 'ok' → 'listo'; 'midiendo' lanza (el editor espera)
  // settings.ts
  export const SETTINGS_ID = 'configuracion'
  export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'updatedAt'>   // churchName 'Mansedumbre II', coverTitle 'Anuncios', currency 'DOP', timeFormat '12h', birthdayDefaultMessage '¡Feliz cumpleaños!', dateStyle 'largo', relativeDates false, slideStyle 'almanaque', defaultThemeId 'neutro'
  export async function loadSettings(db: AppDb): Promise<Settings>    // guardado o los valores por defecto
  // useDb.ts
  export function provideDb(db: AppDb): void
  export function useDb(): AppDb
  export function useLiveQuery<T>(query: () => Promise<T>, initial: T): Readonly<Ref<T>>   // liveQuery de Dexie; se cancela al desmontar
  ```

- [ ] **Step 1: pruebas que fallan** (`announcements.test.ts`, hoy `'2026-11-01'`): `isPast` con `'2026-10-31'` → true, `'2026-11-01'` → false, sin fecha → false; `filterAnnouncements` activos excluye pasados y ordena por fecha con los sin fecha al final; pasados ordena descendente; filtro por `typeId`; `duplicate` quita `id`, pone `status 'borrador'`, copia `values` en profundidad (cambiar la copia no cambia el original); `draftFrom('cumpleanos', …)` trae `modo: 'individual'`; `statusFor` en los 4 casos; `eventDateOf('aviso', {})` → undefined.
- [ ] **Step 2: pruebas que fallan** (`settings.test.ts`, con `fake-indexeddb`): `loadSettings` sin registro → `DEFAULT_SETTINGS` con `id: SETTINGS_ID`; con registro → el guardado; `createRepository(db.settings).list()` no lanza (índice `updatedAt`). Y en `repository.test.ts`: guardar un objeto `reactive()` y mutarlo después no cambia lo guardado.
- [ ] **Step 3:** `pnpm vitest run announcements settings repository` → FAIL.
- [ ] **Step 4:** implementar. `repository.put` guarda `structuredClone(toRaw(record))`. Dexie versión 2 solo agrega el índice. Mensaje de precio no numérico: "Escribe el precio en números (por ejemplo, 500)."
- [ ] **Step 5:** PASS; `pnpm typecheck` → 0.
- [ ] **Step 6:** commit `feat(datos): reglas de anuncios, configuración por defecto y acceso reactivo [RF-02, RF-07, RF-08]`.

### Task 3: Inicio y lista de anuncios

**Files:** Create `src/views/AnnouncementsView.vue`, `src/ui/components/UiConfirm.vue`, `src/ui/components/AnnouncementRow.vue`, `tests/browser/views/announcements.test.ts`. Modify `src/views/HomeView.vue`.

- Inicio (SRS §6.1): botón principal "Nuevo anuncio" (atajo `N`), lista de los próximos anuncios activos (máx. 8) y un enlace "Ver todos". La tarjeta de la presentación del sábado llega en P5.
- Lista (RF-08): pestañas "Activos" / "Pasados" y filtro por tipo (chips con ícono del tipo). Cada fila (`DESIGN.md` → Listas): marca del color del tipo, título (o "Sin título" en `ink-muted`), fecha en `meta`, etiqueta de estado (`BORRADOR`, `NO CABE`) y acciones "Duplicar" y "Eliminar". Tocar la fila abre el editor.
- Eliminar: `UiConfirm` ("¿Eliminar «Semana de oración»?", botones "Eliminar" y "Cancelar"); el borrado es lógico (`deletedAt`). Duplicar: crea la copia y abre su editor con el foco en la fecha (RF-02).
- Lista vacía: invitación ("Todavía no hay anuncios activos.") con el botón "Nuevo anuncio".

- [ ] **Step 1: pruebas que fallan** (browser, base de datos de prueba por `provideDb`): con 3 anuncios (uno pasado) → "Activos" muestra 2 en orden de fecha y "Pasados" 1; filtro "Culto" deja solo los cultos; "Eliminar" + confirmar → la fila desaparece y el registro tiene `deletedAt`; "Duplicar" → existe un anuncio nuevo con el mismo título y estado `borrador`, y la ruta es `editar` con su id; lista vacía muestra la invitación.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(app): inicio y lista de anuncios con filtros, duplicar y eliminar [RF-02, RF-07, RF-08, §6.1]`.

### Task 4: Paso 1, elegir el tipo

**Files:** Create `src/views/NewAnnouncementView.vue`, `tests/browser/views/newAnnouncement.test.ts`.

- Rejilla de tarjetas (`DESIGN.md` → Selector de tipo) desde `ANNOUNCEMENT_TYPES`, en su orden: ícono Lucide 32 px, nombre y una línea de descripción por tipo (`TYPE_DESCRIPTIONS` en el mismo archivo, en español). Con teclado: flechas para moverse y Enter para elegir; los números `1`–`7` eligen directo.
- Elegir un tipo navega a `nuevo-tipo` con su `typeId`.

- [ ] **Step 1: pruebas que fallan:** se ven 7 tarjetas con los nombres de `ANNOUNCEMENT_TYPES`; clic en "Culto / Servicio especial" → ruta `nuevo-tipo` con `typeId 'culto'`; la tecla `6` elige "Aviso breve".
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(app): elegir el tipo de anuncio [RF-01, §6.2]`.

### Task 5: Campos del formulario generados desde `FieldDef`

**Files:** Create `src/editor/fields/FieldText.vue` (text y longtext), `FieldDate.vue`, `FieldTime.vue`, `FieldMoney.vue`, `FieldChoice.vue`, `FieldList.vue`, `FieldImage.vue`, `FieldPeople.vue`, `src/editor/AnnouncementForm.vue`, `src/ui/components/UiField.vue`, `src/ui/components/UiBanner.vue`, `tests/browser/editor/fields.test.ts`.

**Interfaces:**
- Produces:
  ```ts
  // AnnouncementForm.vue
  props: { typeDef: AnnouncementTypeDef; values: Record<string, unknown>; errors: Record<string, string>; flagged?: string[] }
  emits: { 'update:values': [values]; blur: [fieldKey: string] }
  // cada campo: props { field: FieldDef; modelValue: unknown; error?: string }, emit 'update:modelValue'; raíz con id `campo-${field.key}`
  ```
- `UiField`: etiqueta, "*" si es obligatorio, contador `n/maxLength` en `meta` (pasa a `warning` al 90 % y a `danger` al llegar), mensaje de error con ícono debajo, `aria-describedby` y `aria-invalid`.
- Por tipo de campo: `money` acepta "1,500" y "1500" y guarda número; `list` es una entrada de chips (Enter o coma agrega, Backspace en vacío quita el último); `choice` son botones de opción (radio); `image` sube con `saveImage` (`kind` 'foto' o 'flyer' según el tipo: 'flyer' en `imagen`), muestra la miniatura y "Quitar" (solo quita la referencia), y si es `flyer` y mide < 1280 px de ancho muestra `UiBanner` de aviso (RF-42); `people` es una lista editable de personas (nombre, día y mes en selectores, foto opcional con `FieldImage`), con "Agregar persona", y nunca pide año ni edad (§3.3).
- Los errores se muestran tras salir del campo (`blur`) o tras intentar guardar, nunca mientras se escribe por primera vez.

- [ ] **Step 1: pruebas que fallan:** un formulario de `culto` muestra sus campos en orden, con "*" en los obligatorios; escribir 57 de 60 caracteres en el título pone el contador en aviso; `money` con "1,500" emite `1500`; `list`: "Agua" + Enter + "Gorra" + Enter → `['Agua','Gorra']`; `image`: subir un PNG → emite el id; subir el mismo PNG otra vez → el mismo id (sin duplicar); "Quitar" → `undefined` y el blob sigue en `imageBlobs`; flyer de 1080×1920 → aviso de baja resolución (1080 < 1280 de ancho); de 1920×1080 → sin aviso; `people`: agregar 2 personas emite 2 `Person` válidas y ningún control menciona año ni edad; un error de `validateValues` aparece bajo su campo con `aria-invalid`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(editor): formulario generado desde los tipos, con contadores y subida de imágenes [RF-01, RF-04, RF-42, §3.3]`.

### Task 6: Editor con vista previa en vivo

**Files:** Create `src/editor/useAnnouncementDraft.ts`, `src/editor/PreviewPanel.vue`, `src/editor/SlideOptions.vue`, `src/views/EditorView.vue`, `tests/browser/editor/editor.test.ts`, `tests/unit/editor/draft.test.ts`.

**Interfaces:**
- Consumes: Task 2 (`draftFrom`, `statusFor`, `eventDateOf`, `loadSettings`), Task 5 (`AnnouncementForm`), P3 (`buildSlides`, `templatesFor`, `SlideView`, `deriveTheme`, `PRESET_THEMES`, `SLIDE_STYLES`).
- Produces:
  ```ts
  export function useAnnouncementDraft(initial: NewRecord<Announcement>, ctx: Ref<SlideContext>): {
    draft: Ref<NewRecord<Announcement>>          // values, templateId, logo, slideStyle, customPrimaryColor, dateStyle, relativeDates, presenterNotes
    validation: ComputedRef<ValidationResult>
    slides: ComputedRef<SlideSpec[]>             // buildSlides(draft); [] si el tipo no tiene plantilla
    slideStatus: Ref<SlideStatus>                // lo emite PreviewPanel; con varias slides, la peor
    dirty: ComputedRef<boolean>
    save(): Promise<Announcement>                // espera a que slideStatus deje 'midiendo' (máx. 2 s; si no, guarda 'borrador')
  }
  ```

Pantalla (SRS §6.3, `DESIGN.md` → Layout):
- Desde 1024 px: formulario a la izquierda y vista previa a la derecha, fija. En el celular: vista previa arriba, plegable ("Ocultar vista previa"), y el formulario debajo.
- **Vista previa:** `SlideView` de cada `SlideSpec` (los cumpleaños pueden dar varias, en tira con "(1/2)"). Debajo, la línea de estado: `no_cabe` → banda `danger-bg` "No cabe: {etiqueta del campo}" con enlace al campo (`#campo-{key}`), y ese campo recibe el mensaje de RF-10 ("Este texto es muy largo para leerse bien desde lejos; acórtalo o muévelo a las notas del presentador"). Por densidad, el mensaje dice que hay demasiados datos y nombra el campo.
- **SlideOptions** (debajo de la vista previa): plantilla (`templatesFor`, solo si hay más de una), estilo (los 3 de `SLIDE_STYLES`, con el de Configuración marcado "Por defecto"), tema (`PRESET_THEMES` como muestras de color + "Color propio" con `<input type="color">`; si `deriveTheme(color).warning`, `UiBanner` de aviso con ese texto), "Logo en la slide" (Iglesia, Ninguno, un ministerio o varios, hasta 3; logotipo o isotipo), formato de fecha (`DateStyle` con un ejemplo de cada uno y "Fechas relativas").
- **Notas del presentador** (RF-06): `textarea` al final del formulario, con la ayuda "No se proyectan".
- **Guardar** (botón principal; `Ctrl+S`): siempre se puede, como borrador si no valida (RF-10). Al guardar se muestra "Guardado" y se queda en el editor. Con un anuncio nuevo, la ruta pasa a `editar/:id` (`router.replace`).
- **Cambios sin guardar:** `onBeforeRouteLeave` y `beforeunload` piden confirmación si `dirty`.
- **Anuncio inexistente o borrado** (`/anuncios/xyz`): mensaje "No encontramos este anuncio." con enlace a la lista.
- **RNF-04:** la vista previa se recalcula en cada cambio, sin debounce; se mide en la prueba.

- [ ] **Step 1: pruebas unitarias que fallan** (`draft.test.ts`): `dirty` es falso al abrir y verdadero tras cambiar un valor; `slides` de un culto tiene 1 `SlideSpec` con el `slideStyle` elegido; de cumpleaños `grupo` con 9 personas sin foto, 2; `save` con `slideStatus` `midiendo` que pasa a `no_cabe` → guarda `status 'no_cabe'`; que nunca deja de medir → `'borrador'` a los 2 s (temporizadores falsos).
- [ ] **Step 2: pruebas de navegador que fallan** (`editor.test.ts`): escribir el título actualiza el texto de la slide en < 200 ms (medido con `performance.now()` entre el `input` y el cambio del `[data-role="title"]`); un título de 95 caracteres → banda "No cabe: Título" y el campo con el mensaje de RF-10; guardar un culto válido → registro con `status 'listo'`, `eventDate` igual a la fecha y la ruta `editar/:id`; un anuncio guardado con `values` que no validan abre con los errores en sus campos; cambiar a otro estilo cambia la slide; elegir "Ninguno" en el logo quita `[data-logo]`; color propio `#fff59d` muestra el aviso de color ajustado; con cambios sin guardar, navegar a Inicio pide confirmación.
- [ ] **Step 3:** FAIL. **Step 4:** implementar. **Step 5:** PASS; `pnpm typecheck` → 0.
- [ ] **Step 6:** commit `feat(editor): vista previa en vivo, opciones de la slide, notas y guardado [RF-03, RF-06, RF-09, RF-10, RNF-04]`.

### Task 7: Flujo completo sin red y verificación

**Files:** Create `tests/e2e/anuncios.spec.ts`. Modify `HANDOFF.md`, hoja de ruta.

- [ ] **Step 1:** `anuncios.spec.ts` (proyecto `chromium`, contra el build): tras cargar una vez, **sin red** (`context.setOffline(true)`):
  1. Desde Inicio: "Nuevo anuncio" → "Culto" → llenar título, fecha y hora → Guardar.
  2. Volver a Inicio: el anuncio aparece.
  3. Duplicarlo y cambiar la fecha.
  4. Recargar la página: los dos siguen ahí.
  5. Eliminar uno.

  Medir el tiempo del paso 1 con los teclazos de Playwright, como referencia de RNF-03; se anota el tiempo y no se usa como aserción. Ningún request a otro origen en todo el flujo.
- [ ] **Step 2:** en el celular (`devices['Pixel 7']`): el editor muestra la vista previa arriba y plegable, y no hay scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`).
- [ ] **Step 3:** verificación completa: `pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` → todo verde.
- [ ] **Step 4:** HANDOFF (API de la interfaz, P4 hecho, próximo = P5) y hoja de ruta.
- [ ] **Step 5:** commit `test(app): crear, duplicar y eliminar anuncios sin red [RF-01…RF-10, RNF-01, RNF-03]`.

---

## Fuera de alcance de P4 (anotado para después)

- Pantalla de **Configuración** (SRS §6.7, RF-110…RF-113) y gestión de ministerios y logos subidos (RF-36): P4 usa `loadSettings` con valores por defecto y los ministerios que existan. Hay que asignarla a un bloque; propuesta: entre P5 y P6, o al inicio de P5.
- Presentación del sábado en Inicio, miniaturas y "Preparar sin internet": P5.
- Cuentas, `createdBy`/`updatedBy` y sincronización: paso 8.
