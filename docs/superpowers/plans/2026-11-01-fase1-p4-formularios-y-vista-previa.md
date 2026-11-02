# P4 · Formularios y vista previa: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paso 5 de SRS §11: la app deja de ser un esqueleto. El equipo crea, edita, duplica, elimina y filtra anuncios desde el celular o la laptop, con un formulario generado desde los `FieldDef`, vista previa en vivo de la slide real y el aviso "No cabe" en el campo culpable. Todo funciona sin red.

**Architecture:** Organización **por funcionalidad** (`src/features/<funcionalidad>/`), con un sistema de diseño propio en `src/ui/` y el marco de la app en `src/app/`. Las páginas (componentes de ruta) solo componen: no tienen lógica ni marcado largo. La lógica vive en funciones puras (`src/data/announcements.ts`) y composables (`use*.ts`), probados aparte. Estilos **solo con Tailwind CSS v4**: los tokens de `DESIGN.md` van en el `@theme` de `src/ui/styles.css`, el único archivo CSS de la interfaz; ningún componente tiene `<style>`. Rutas con `vue-router` (historial HTML5); datos en Dexie leídos con `liveQuery` envuelto en un composable; sin Pinia. La vista previa reutiliza `buildSlides` + `SlideView` de P3.

**Tech Stack:** Lo de P1–P3 + `vue-router` 4, `tailwindcss` 4 + `@tailwindcss/vite`, `@fontsource/instrument-serif` y `@fontsource-variable/inter` (OFL). Gestor: **pnpm**.

**Spec:** `SRS.md` v1.5 (§2.1 usuarios de la interfaz, §3.1 RF-01…RF-10, §3.6 RF-42, §4 RNF-01, RNF-03, RNF-04, RNF-10, §6 pantallas 1–3, §7 `Announcement`, §8.1 Tailwind para la interfaz). Diseño de la interfaz: `DESIGN.md`. Hoja de ruta: `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md` (P4). Lo que consume de P3: `buildSlides`, `templatesFor`, `paletteFor`, `SlideView` (estado `ok` / `no_cabe` / `midiendo`), `deriveTheme`, `PRESET_THEMES`, `SLIDE_STYLES`.

## Global Constraints

- **HANDOFF.md:** leerlo antes de cada tarea si no está en el contexto; actualizarlo al terminarla y añadirlo a su commit.
- **pnpm** para todo. Nunca npm.
- **Estilos solo con Tailwind (regla estricta del responsable).** En `src/app/`, `src/ui/` y `src/features/`: ningún bloque `<style>`, ningún archivo `.css` salvo `src/ui/styles.css`, y ningún `style="…"` escrito a mano. `styles.css` contiene solo `@import "tailwindcss"`, el `@theme` con los tokens de `DESIGN.md`, su redefinición para el tema oscuro y la variante `dark`; ninguna regla para componentes. Un valor que solo se conoce en ejecución (el color de un tipo, el tamaño de la vista previa) entra como **variable CSS** (`:style="{ '--type-accent': color }"`) y se usa con una clase (`bg-(--type-accent)`). Sin `@apply`.
- **Las slides quedan fuera de esa regla y de los tokens:** su geometría la calcula el motor y se aplica en línea (P1–P3); deben verse igual con o sin la hoja de la interfaz. Ningún token de `DESIGN.md` entra en `src/slides/`.
- **Componentes y tamaño.** Una responsabilidad por archivo. Páginas (`*Page.vue`) ≤ 80 líneas: solo componen componentes y composables. Componentes `.vue` ≤ 150 líneas; composables y módulos `.ts` ≤ 200. Lógica fuera de las plantillas: en un `computed`, un composable o una función pura.
- **Sin duplicar.** Lo que se usa en dos lugares vive una vez: controles en `src/ui/`, piezas compartidas de anuncios en `src/features/announcements/shared/`, reglas en `src/data/announcements.ts`. Antes de crear un componente se busca si ya existe uno que sirva. La prueba de arquitectura (Task 1) hace cumplir las reglas que se pueden medir.
- **Nombres que dicen qué es:** páginas `*Page.vue`, controles base `Ui*.vue`, campos `Field*.vue`, composables `use*.ts`. Un archivo `index.ts` por carpeta de funcionalidad solo si otra funcionalidad la consume.
- **Offline (C-03, RNF-01):** fuentes e íconos empaquetados y precacheados; ningún `fetch` ni CSS a otro origen. La E2E de P1 "sin orígenes externos" sigue pasando.
- **Usuarios de la interfaz (SRS v1.5 §2.1):** jóvenes y adultos con soltura tecnológica. Interfaz rápida y eficiente; nada "para principiantes". Contraste WCAG AA (4.5:1 texto, 3:1 bordes de campos), foco visible, todo usable con teclado y en el celular (zonas táctiles ≥ 44 px).
- **RNF-03:** un anuncio típico en ≤ 2 minutos. **RNF-04:** la vista previa se actualiza en < 200 ms al teclear.
- **RNF-10:** nunca "undefined", huecos ni íconos de imagen rota en la interfaz.
- **Textos de interfaz en español**, en el tono de `DESIGN.md` (cortos, dicen qué pasó y qué hacer). Identificadores en inglés.
- **Licencias:** anotar `vue-router` (MIT), `tailwindcss` (MIT), Instrument Serif e Inter (OFL) en `LICENSES.md`.
- **Commits:** en español con IDs del SRS y `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Tras unir a `master`, `git push origin master`.

## Review Focus

- **Guardar mientras la slide está "midiendo"** (se teclea y se pulsa Ctrl+S al instante) → se guarda con el estado ya medido, nunca `listo` para una slide que no cabe. Prueba en Task 6.
- **Anuncio guardado con valores que ya no validan** (un tipo cambió o un dato quedó a medias) → el editor abre, muestra los errores en sus campos y deja corregir; nunca pantalla en blanco. Prueba en Task 6.
- **Salir del editor con cambios sin guardar** (otra ruta, recargar, cerrar la pestaña) → se pregunta antes de perderlos. Prueba en Task 6.
- **La hoja de la interfaz cambia las slides** (el preflight de Tailwind reinicia `img`, `svg`, márgenes y alturas de línea) → la slide de la vista previa mide y se ve igual que en las pruebas de P3. Prueba en Task 1.
- **Imágenes** → subir la misma foto dos veces no duplica; quitar la foto de un campo no borra el blob (puede usarla otro anuncio); un flyer de menos de 1280 px avisa sin bloquear (RF-42). Prueba en Task 5.

---

## Estructura de archivos

Por funcionalidad: todo lo de "anuncios" está en una carpeta, y dentro, cada pantalla en la suya. Se entiende qué hace cada archivo por su ruta.

```
src/
  main.ts                                 # crea la app: router, base de datos, estilos, fuentes
  app/                                    # el marco
    App.vue                               #   AppHeader + <RouterView>
    AppHeader.vue                         #   nombre de la app y navegación
    router.ts                             #   rutas, guardas, carga diferida de páginas
  ui/                                     # sistema de diseño (DESIGN.md), sin nada de anuncios
    styles.css                            #   ÚNICO CSS: Tailwind + tokens (@theme) + tema oscuro
    fonts.ts                              #   Instrument Serif + Inter empaquetadas
    UiButton.vue  UiIconButton.vue        #   variantes principal/secundario/fantasma/peligro
    UiField.vue                           #   etiqueta, *, contador, error con ícono, aria
    UiInput.vue  UiTextarea.vue  UiSelect.vue
    UiChoiceGroup.vue                     #   botones de opción (radio): campos choice, estilo, fecha, pestañas
    UiChip.vue  UiBadge.vue               #   filtros / etiquetas de estado en `meta`
    UiBanner.vue                          #   avisos danger/success/warning
    UiConfirm.vue                         #   diálogo solo para acciones destructivas
    UiEmptyState.vue  UiPageHeader.vue
    useShortcut.ts                        #   atajos de teclado (N, Ctrl+S, 1–7, Esc) sin repetir listeners
  data/                                   # (P2) + reglas y acceso reactivo
    announcements.ts                      #   eventDate, activos/pasados, filtros, duplicar, estado (puro)
    settings.ts                           #   Configuración con valores por defecto
    useDb.ts                              #   provide/inject de AppDb + useLiveQuery
  features/
    home/
      HomePage.vue                        #   Inicio (SRS §6.1)
    announcements/
      shared/                             #   piezas usadas por varias pantallas de anuncios
        TypeMark.vue                      #     ícono + color del tipo (fila, tarjeta, chip)
        StatusBadge.vue                   #     BORRADOR / NO CABE / PASADO
        AnnouncementRow.vue               #     fila de lista (Inicio y Anuncios)
        useAnnouncementActions.ts         #     duplicar y eliminar con confirmación (Inicio y Anuncios)
      list/
        AnnouncementsPage.vue             #   lista (RF-08)
        AnnouncementFilters.vue           #   pestañas Activos/Pasados + chips de tipo
        useAnnouncementList.ts            #   consulta viva + filtros
      new/
        NewAnnouncementPage.vue           #   paso 1 (RF-01)
        TypeCard.vue
        typeDescriptions.ts
      editor/
        EditorPage.vue                    #   paso 2: carga el anuncio y compone (RF-03)
        EditorLayout.vue                  #   dos columnas / apilado en el celular
        useAnnouncementDraft.ts           #   borrador, validación, slides, estado, guardar
        useUnsavedGuard.ts                #   onBeforeRouteLeave + beforeunload
        form/
          AnnouncementForm.vue            #     recorre los FieldDef
          FieldControl.vue                #     elige el campo por FieldKind (un solo mapa)
          fields/FieldText.vue  FieldDate.vue  FieldTime.vue  FieldMoney.vue
                 FieldChoice.vue  FieldList.vue  FieldImage.vue  FieldPeople.vue  PersonRow.vue
          PresenterNotes.vue
        preview/
          PreviewPanel.vue                #     SlideView(s) + plegable en el celular
          FitStatusBanner.vue             #     "No cabe: {campo}" con enlace
        options/
          SlideOptions.vue                #     compone las opciones
          StylePicker.vue  ThemePicker.vue  LogoPicker.vue  DateFormatPicker.vue
tests/
  unit/architecture.test.ts               # hace cumplir: sin <style>, un solo .css, tamaños, nombres
  unit/app/  unit/data/  unit/features/   # lógica pura y composables
  browser/ui/  browser/features/…         # componentes montados (Chromium)
  e2e/anuncios.spec.ts
```

Dependencias permitidas (de arriba abajo): `app → features → ui, data, slides`; `features/x` no importa de `features/y` salvo `announcements/shared` dentro de anuncios y `home → announcements/shared`; `ui` no importa de `features`, `data` ni `slides`. La prueba de arquitectura lo revisa.

---

### Task 1: Marco, rutas, Tailwind y reglas de arquitectura

**Files:** Create `src/app/App.vue` (mueve el actual), `src/app/AppHeader.vue`, `src/app/router.ts`, `src/ui/styles.css`, `src/ui/fonts.ts`, `src/ui/UiButton.vue`, `src/ui/UiPageHeader.vue`, `src/ui/useShortcut.ts`, `src/features/home/HomePage.vue` (vacía por ahora), `tests/unit/architecture.test.ts`, `tests/unit/app/router.test.ts`, `tests/unit/ui/useShortcut.test.ts`, `tests/browser/ui/stylesheet-vs-slides.test.ts`. Delete `src/App.vue`. Modify `src/main.ts`, `vite.config.ts` (plugin de Tailwind; colores del manifiesto `#F3F0D6` / `#1A1A1A`), `package.json`, `LICENSES.md`, `DESIGN.md` (sección "Implementación"), `tests/e2e/offline.spec.ts`.

**Interfaces:**
- Produces:
  ```ts
  // app/router.ts
  export const routes: RouteRecordRaw[]   // 'inicio' '/', 'anuncios' '/anuncios', 'nuevo' '/anuncios/nuevo',
                                          // 'nuevo-tipo' '/anuncios/nuevo/:typeId', 'editar' '/anuncios/:id'
  export function createAppRouter(history?: RouterHistory): Router
  // ui/useShortcut.ts
  export function useShortcut(keys: string, handler: (e: KeyboardEvent) => void, opts?: { allowInFields?: boolean }): void
  //   'n', 'mod+s' (Ctrl o Cmd), '1'…'7', 'escape'; ignora teclas escritas en campos salvo allowInFields; se quita al desmontar
  ```
- `styles.css` (tokens de Tailwind; un token por fila de `DESIGN.md`): colores `--color-background|surface|muted|ink|ink-muted|hairline|field-border|danger|danger-bg|success|success-bg|warning|warning-bg|accent` (clases `bg-background`, `text-ink`, `border-field-border`…), `--font-display` (Instrument Serif), `--font-body` (Inter Variable), `--font-meta` (monoespaciada), `--radius-sm|md|lg` = 4/8/16 px, `--text-meta` 0.75rem. Tema oscuro: los mismos `--color-*` redefinidos con `@media (prefers-color-scheme: dark)` y con `[data-theme="dark"]`; `@custom-variant dark` sobre ambos.
- `UiButton`: props `variant: 'primary' | 'secondary' | 'ghost' | 'danger'` (por defecto `secondary`), `type`, `to?` (renderiza `RouterLink`); alto `h-11 md:h-10`, foco `focus-visible:outline-2 outline-offset-2 outline-ink`.

- [ ] **Step 1:** `pnpm add vue-router @fontsource/instrument-serif @fontsource-variable/inter` y `pnpm add -D tailwindcss @tailwindcss/vite`; anotar licencias.
- [ ] **Step 2: pruebas que fallan.**
  - `architecture.test.ts` (lee el disco con `node:fs`): ningún `.vue` en `src/app`, `src/ui`, `src/features` contiene `<style`; ninguno contiene `style="`; el único `.css` en esas carpetas es `src/ui/styles.css`; ningún `@apply`; `*Page.vue` ≤ 80 líneas, otros `.vue` ≤ 150, `.ts` ≤ 200; todo `.vue` que `router.ts` importa se llama `*Page.vue`; `src/ui/**` no importa de `features`, `data` ni `slides`; `src/features/<a>` no importa de `src/features/<b>` salvo `announcements/shared`.
  - `router.test.ts` (`createMemoryHistory`): `/anuncios/nuevo/culto` → `nuevo-tipo` con `typeId 'culto'`; `/anuncios/nuevo/no-existe` → redirige a `nuevo` (guarda con `getTypeDef`); `/anuncios/abc` → `editar` con `id 'abc'`; ruta desconocida → `inicio`.
  - `useShortcut.test.ts` (montado con un componente mínimo): `n` llama al handler; `n` escrito dentro de un `<input>` no; `ctrl+s` llama y hace `preventDefault`; al desmontar ya no llama.
  - `stylesheet-vs-slides.test.ts` (browser): importa `src/ui/styles.css`, renderiza con `renderSlide` un culto Clásica, una Visual con foto y la slide de imagen; `auditSlide` sin violaciones y las cajas de `[data-role]` y `[data-image]` iguales (±1 px) a las de un render sin la hoja (iframe o render previo antes de inyectarla).
- [ ] **Step 3:** `pnpm vitest run architecture router useShortcut stylesheet-vs-slides` → FAIL.
- [ ] **Step 4:** implementar. `main.ts` importa `./ui/styles.css`, `./ui/fonts`, `./slides/fonts`, crea el router y monta `app/App.vue`. Inicio se carga directo; las demás páginas con `import()`. Si el preflight cambia las slides, la corrección va en `SlideCanvas`/plantillas con clases o atributos que la neutralicen (por ejemplo `max-w-none` en las imágenes de la slide), no con CSS a mano.
- [ ] **Step 5:** `DESIGN.md` → sección "Implementación": tabla token → clase de Tailwind y las reglas (solo Tailwind, variables CSS para valores en ejecución, tamaños de archivo).
- [ ] **Step 6:** `offline.spec.ts` añade: sin red, `/anuncios` carga y `document.fonts.check('16px "Inter Variable"')` es verdadero tras `document.fonts.load`.
- [ ] **Step 7:** PASS; `pnpm typecheck` → 0; `pnpm test` → todo verde; `pnpm test:e2e --project chromium` → PASS.
- [ ] **Step 8:** commit `feat(app): marco, rutas, Tailwind con los tokens de la interfaz y reglas de arquitectura [§6, §8.1, RNF-01]`.

### Task 2: Reglas de los anuncios y acceso a datos

**Files:** Create `src/data/announcements.ts`, `src/data/settings.ts`, `src/data/useDb.ts`, `tests/unit/data/announcements.test.ts`, `tests/unit/data/settings.test.ts`. Modify `src/data/local/repository.ts` (copia profunda al guardar), `src/data/local/db.ts` (versión 2: índice `updatedAt` en `settings`), `src/slides/types/validation.ts` (mensaje de precio no numérico), `tests/unit/data/repository.test.ts`.

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
  export function displayTitle(a: Pick<Announcement, 'typeId' | 'values'>): string | undefined   // título o nombre, sin "undefined"
  // settings.ts
  export const SETTINGS_ID = 'configuracion'
  export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'updatedAt'>   // churchName 'Mansedumbre II', coverTitle 'Anuncios', currency 'DOP', timeFormat '12h', birthdayDefaultMessage '¡Feliz cumpleaños!', dateStyle 'largo', relativeDates false, slideStyle 'almanaque', defaultThemeId 'neutro'
  export async function loadSettings(db: AppDb): Promise<Settings>    // guardado o los valores por defecto
  // useDb.ts
  export function provideDb(db: AppDb): void
  export function useDb(): AppDb
  export function useLiveQuery<T>(query: () => Promise<T>, initial: T): Readonly<Ref<T>>   // liveQuery de Dexie; se cancela al desmontar
  ```

- [ ] **Step 1: pruebas que fallan** (`announcements.test.ts`, hoy `'2026-11-01'`): `isPast` con `'2026-10-31'` → true, `'2026-11-01'` → false, sin fecha → false; `filterAnnouncements` activos excluye pasados y ordena por fecha con los sin fecha al final; pasados ordena descendente; filtro por `typeId`; `duplicate` quita `id`, pone `status 'borrador'`, copia `values` en profundidad (cambiar la copia no cambia el original); `draftFrom('cumpleanos', …)` trae `modo: 'individual'`; `statusFor` en los 4 casos; `eventDateOf('aviso', {})` → undefined; `displayTitle` de un aviso sin título → undefined (la interfaz pone "Sin título").
- [ ] **Step 2: pruebas que fallan** (`settings.test.ts`, con `fake-indexeddb`): `loadSettings` sin registro → `DEFAULT_SETTINGS` con `id: SETTINGS_ID`; con registro → el guardado; `createRepository(db.settings).list()` no lanza (índice `updatedAt`). En `repository.test.ts`: guardar un objeto `reactive()` y mutarlo después no cambia lo guardado.
- [ ] **Step 3:** `pnpm vitest run announcements settings repository` → FAIL.
- [ ] **Step 4:** implementar. `repository.put` guarda `structuredClone(toRaw(record))`. Dexie versión 2 solo agrega el índice. Mensaje de precio no numérico: "Escribe el precio en números (por ejemplo, 500)."
- [ ] **Step 5:** PASS; `pnpm typecheck` → 0; `pnpm vitest run architecture` → PASS.
- [ ] **Step 6:** commit `feat(datos): reglas de anuncios, configuración por defecto y acceso reactivo [RF-02, RF-07, RF-08]`.

### Task 3: Inicio y lista de anuncios

**Files:** Create `src/ui/UiConfirm.vue`, `src/ui/UiChip.vue`, `src/ui/UiBadge.vue`, `src/ui/UiChoiceGroup.vue`, `src/ui/UiEmptyState.vue`, `src/ui/UiIconButton.vue`, `src/features/announcements/shared/{TypeMark,StatusBadge,AnnouncementRow}.vue`, `src/features/announcements/shared/useAnnouncementActions.ts`, `src/features/announcements/list/{AnnouncementsPage,AnnouncementFilters}.vue`, `src/features/announcements/list/useAnnouncementList.ts`, `tests/browser/features/announcements-list.test.ts`, `tests/browser/ui/UiConfirm.test.ts`. Modify `src/features/home/HomePage.vue`, `src/app/router.ts`.

**Interfaces:**
- Consumes: Task 1 (`useShortcut`, `UiButton`, `UiPageHeader`), Task 2 (`filterAnnouncements`, `duplicate`, `displayTitle`, `useDb`, `useLiveQuery`).
- Produces:
  ```ts
  // ui/UiChoiceGroup.vue — la usan pestañas, campos choice, estilo y formato de fecha
  props: { modelValue: string; options: { value: string; label: string; hint?: string }[]; label: string; variant?: 'segmented' | 'cards' }
  emits: { 'update:modelValue': [value: string] }      // role="radiogroup", flechas para moverse
  // ui/UiConfirm.vue
  export function useConfirm(): (o: { title: string; confirmLabel: string; danger?: boolean }) => Promise<boolean>
  //   un solo <UiConfirm> montado en App.vue (provide/inject); devuelve true al confirmar, false con Cancelar o Esc
  // shared/useAnnouncementActions.ts
  export function useAnnouncementActions(): { duplicateAndOpen(a: Announcement): Promise<void>; remove(a: Announcement): Promise<boolean> }
  // shared/AnnouncementRow.vue — props { announcement: Announcement; today: string }; emits duplicate, remove
  // list/useAnnouncementList.ts
  export function useAnnouncementList(opts?: { limit?: number }): { view: Ref<AnnouncementView>; typeId: Ref<string | undefined>; items: ComputedRef<Announcement[]> }
  ```

- Inicio (SRS §6.1): `UiPageHeader` con el botón principal "Nuevo anuncio" (atajo `N`), los próximos activos (`useAnnouncementList({ limit: 8 })` + `AnnouncementRow`) y el enlace "Ver todos". La tarjeta de la presentación del sábado llega en P5.
- Lista (RF-08): `AnnouncementFilters` (pestañas con `UiChoiceGroup` segmentada + `UiChip` con `TypeMark` por tipo) y filas `AnnouncementRow` (`TypeMark`, título o "Sin título" en `text-ink-muted`, fecha en `font-meta`, `StatusBadge`, acciones "Duplicar" y "Eliminar"; tocar la fila abre el editor).
- Eliminar: `useConfirm` ("¿Eliminar «Semana de oración»?", "Eliminar"); el borrado es lógico (`deletedAt`). Duplicar: crea la copia y abre su editor con el foco en la fecha (RF-02).
- Lista vacía: `UiEmptyState` ("Todavía no hay anuncios activos.") con el botón "Nuevo anuncio".

- [ ] **Step 1: pruebas que fallan** (browser, base de datos de prueba por `provideDb`): con 3 anuncios (uno pasado) → "Activos" muestra 2 en orden de fecha y "Pasados" 1; filtro "Culto" deja solo los cultos; "Eliminar" + confirmar → la fila desaparece y el registro tiene `deletedAt`; "Eliminar" + Esc → no borra; "Duplicar" → existe un anuncio nuevo con el mismo título y estado `borrador`, y la ruta es `editar` con su id; lista vacía muestra la invitación; Inicio y Anuncios montan el mismo `AnnouncementRow` (sin copia del marcado). `UiConfirm.test.ts`: Esc y Cancelar devuelven false; el foco vuelve al botón que lo abrió.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS; `pnpm vitest run architecture` → PASS.
- [ ] **Step 5:** commit `feat(app): inicio y lista de anuncios con filtros, duplicar y eliminar [RF-02, RF-07, RF-08, §6.1]`.

### Task 4: Paso 1, elegir el tipo

**Files:** Create `src/features/announcements/new/{NewAnnouncementPage,TypeCard}.vue`, `src/features/announcements/new/typeDescriptions.ts`, `tests/browser/features/new-announcement.test.ts`. Modify `src/app/router.ts`.

- Rejilla de `TypeCard` (`DESIGN.md` → Selector de tipo) desde `ANNOUNCEMENT_TYPES`, en su orden: `TypeMark` (ícono Lucide 32 px y borde superior del color del tipo), nombre y una línea de `TYPE_DESCRIPTIONS`. Con teclado: flechas para moverse y Enter para elegir; `1`–`7` eligen directo (`useShortcut`).
- Elegir un tipo navega a `nuevo-tipo` con su `typeId`.

- [ ] **Step 1: pruebas que fallan:** se ven 7 tarjetas con los nombres de `ANNOUNCEMENT_TYPES`; clic en "Culto / Servicio especial" → ruta `nuevo-tipo` con `typeId 'culto'`; la tecla `6` elige "Aviso breve"; `TYPE_DESCRIPTIONS` tiene una entrada por tipo.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS; `pnpm vitest run architecture` → PASS.
- [ ] **Step 5:** commit `feat(app): elegir el tipo de anuncio [RF-01, §6.2]`.

### Task 5: Campos del formulario generados desde `FieldDef`

**Files:** Create `src/ui/{UiField,UiInput,UiTextarea,UiSelect,UiBanner}.vue`, `src/features/announcements/editor/form/{AnnouncementForm,FieldControl}.vue`, `src/features/announcements/editor/form/fields/{FieldText,FieldDate,FieldTime,FieldMoney,FieldChoice,FieldList,FieldImage,FieldPeople,PersonRow}.vue`, `tests/browser/ui/UiField.test.ts`, `tests/browser/features/editor-fields.test.ts`.

**Interfaces:**
- Produces:
  ```ts
  // AnnouncementForm.vue
  props: { typeDef: AnnouncementTypeDef; values: Record<string, unknown>; errors: Record<string, string>; flagged?: string[] }
  emits: { 'update:values': [values]; blur: [fieldKey: string] }
  // FieldControl.vue: un mapa FieldKind → componente; AnnouncementForm no conoce los campos concretos
  // cada Field*: props { field: FieldDef; modelValue: unknown; error?: string }, emit 'update:modelValue'; envuelto en UiField; id `campo-${field.key}`
  // ui/UiField.vue: props { id: string; label: string; required?: boolean; count?: number; max?: number; error?: string; hint?: string }; slot por defecto con { describedBy, invalid }
  ```
- `UiField` hace el trabajo común una vez: etiqueta, "*" si es obligatorio, contador `n/max` en `font-meta` (`text-warning` desde el 90 %, `text-danger` al llegar), error con ícono debajo, `aria-describedby` y `aria-invalid`. Ningún `Field*` repite eso.
- Por tipo de campo: `text`/`longtext` usan `FieldText` (`UiInput` o `UiTextarea`); `money` acepta "1,500" y "1500" y guarda número; `list` es una entrada de chips (`UiChip`; Enter o coma agrega, Backspace en vacío quita el último); `choice` usa `UiChoiceGroup`; `image` sube con `saveImage` (`kind` 'flyer' en el campo `imagen`, si no 'foto'), muestra la miniatura y "Quitar" (solo quita la referencia), y si es flyer y mide < 1280 px de ancho muestra `UiBanner` de aviso (RF-42); `people` es una lista de `PersonRow` (nombre, día y mes con `UiSelect`, foto opcional con `FieldImage`) con "Agregar persona", y nunca pide año ni edad (§3.3).
- Los errores se muestran tras salir del campo (`blur`) o tras intentar guardar, nunca mientras se escribe por primera vez.

- [ ] **Step 1: pruebas que fallan:** un formulario de `culto` muestra sus campos en orden, con "*" en los obligatorios; escribir 57 de 60 caracteres en el título pone el contador en aviso; `money` con "1,500" emite `1500`; `list`: "Agua" + Enter + "Gorra" + Enter → `['Agua','Gorra']`; `image`: subir un PNG → emite el id; subir el mismo PNG otra vez → el mismo id (sin duplicar); "Quitar" → `undefined` y el blob sigue en `imageBlobs`; flyer de 1080×1920 → aviso de baja resolución; de 1920×1080 → sin aviso; `people`: agregar 2 personas emite 2 `Person` válidas y ningún control menciona año ni edad; un error de `validateValues` aparece bajo su campo con `aria-invalid`. `UiField.test.ts`: contador, colores por umbral y `aria-describedby` apuntando al error.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS; `pnpm vitest run architecture` → PASS.
- [ ] **Step 5:** commit `feat(editor): formulario generado desde los tipos, con contadores y subida de imágenes [RF-01, RF-04, RF-42, §3.3]`.

### Task 6: Editor con vista previa en vivo

**Files:** Create `src/features/announcements/editor/{EditorPage,EditorLayout}.vue`, `editor/useAnnouncementDraft.ts`, `editor/useUnsavedGuard.ts`, `editor/form/PresenterNotes.vue`, `editor/preview/{PreviewPanel,FitStatusBanner}.vue`, `editor/options/{SlideOptions,StylePicker,ThemePicker,LogoPicker,DateFormatPicker}.vue`, `tests/unit/features/draft.test.ts`, `tests/browser/features/editor.test.ts`. Modify `src/app/router.ts`.

**Interfaces:**
- Consumes: Task 2 (`draftFrom`, `statusFor`, `eventDateOf`, `loadSettings`), Task 3 (`UiChoiceGroup`, `useConfirm`), Task 5 (`AnnouncementForm`, `UiBanner`), P3 (`buildSlides`, `templatesFor`, `SlideView`, `deriveTheme`, `PRESET_THEMES`, `SLIDE_STYLES`).
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
  export function useUnsavedGuard(dirty: Ref<boolean>): void   // pregunta con useConfirm al cambiar de ruta; beforeunload al cerrar
  ```

Pantalla (SRS §6.3, `DESIGN.md` → Layout):
- `EditorPage` solo carga el anuncio (o crea el borrador con `draftFrom`), llama a `useAnnouncementDraft` y compone `EditorLayout` con `AnnouncementForm` + `PresenterNotes` a la izquierda y `PreviewPanel` + `SlideOptions` a la derecha. Anuncio inexistente o borrado → `UiEmptyState` "No encontramos este anuncio." con enlace a la lista.
- `EditorLayout`: desde `lg` (1024 px), formulario ≈ 40 % y vista previa fija (`lg:sticky`); en el celular, vista previa arriba, plegable ("Ocultar vista previa").
- **Vista previa:** `SlideView` de cada `SlideSpec` (los cumpleaños pueden dar varias, en tira con "(1/2)"). `FitStatusBanner`: `no_cabe` → banda `bg-danger-bg` "No cabe: {etiqueta del campo}" con enlace a `#campo-{key}`, y ese campo recibe el mensaje de RF-10 ("Este texto es muy largo para leerse bien desde lejos; acórtalo o muévelo a las notas del presentador"). Por densidad, dice que hay demasiados datos y nombra el campo.
- **SlideOptions** compone, cada uno en su archivo: plantilla (`UiChoiceGroup` con `templatesFor`, solo si hay más de una), `StylePicker` (los 3 de `SLIDE_STYLES`, el de Configuración marcado "Por defecto"), `ThemePicker` (`PRESET_THEMES` como muestras + "Color propio" con `<input type="color">`; si `deriveTheme(color).warning`, `UiBanner` de aviso), `LogoPicker` (Iglesia, Ninguno, un ministerio o varios, hasta 3; logotipo o isotipo), `DateFormatPicker` (`DateStyle` con un ejemplo de cada uno y "Fechas relativas").
- **Notas del presentador** (RF-06): `PresenterNotes` con `UiTextarea` y la ayuda "No se proyectan".
- **Guardar** (botón principal; `useShortcut('mod+s', …, { allowInFields: true })`): siempre se puede, como borrador si no valida (RF-10). Muestra "Guardado" y se queda en el editor. Con un anuncio nuevo, `router.replace` a `editar/:id`.
- **Cambios sin guardar:** `useUnsavedGuard(dirty)`.
- **RNF-04:** la vista previa se recalcula en cada cambio, sin debounce; se mide en la prueba.

- [ ] **Step 1: pruebas unitarias que fallan** (`draft.test.ts`): `dirty` es falso al abrir y verdadero tras cambiar un valor; `slides` de un culto tiene 1 `SlideSpec` con el `slideStyle` elegido; de cumpleaños `grupo` con 9 personas sin foto, 2; `save` con `slideStatus` `midiendo` que pasa a `no_cabe` → guarda `status 'no_cabe'`; que nunca deja de medir → `'borrador'` a los 2 s (temporizadores falsos).
- [ ] **Step 2: pruebas de navegador que fallan** (`editor.test.ts`): escribir el título actualiza el texto de la slide en < 200 ms (`performance.now()` entre el `input` y el cambio del `[data-role="title"]`); un título de 95 caracteres → banda "No cabe: Título" y el campo con el mensaje de RF-10; guardar un culto válido → registro con `status 'listo'`, `eventDate` igual a la fecha y la ruta `editar/:id`; un anuncio guardado con `values` que no validan abre con los errores en sus campos; cambiar a otro estilo cambia la slide; elegir "Ninguno" en el logo quita `[data-logo]`; color propio `#fff59d` muestra el aviso de color ajustado; con cambios sin guardar, navegar a Inicio pide confirmación; `Ctrl+S` dentro del campo título guarda.
- [ ] **Step 3:** FAIL. **Step 4:** implementar. **Step 5:** PASS; `pnpm typecheck` → 0; `pnpm vitest run architecture` → PASS.
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
- [ ] **Step 4:** HANDOFF (estructura de `src/`, API de la interfaz, P4 hecho, próximo = P5) y hoja de ruta.
- [ ] **Step 5:** commit `test(app): crear, duplicar y eliminar anuncios sin red [RF-01…RF-10, RNF-01, RNF-03]`.

---

## Fuera de alcance de P4 (anotado para después)

- Pantalla de **Configuración** (SRS §6.7, RF-110…RF-113) y gestión de ministerios y logos subidos (RF-36): P4 usa `loadSettings` con valores por defecto y los ministerios que existan. Hay que asignarla a un bloque; propuesta: al inicio de P5.
- Presentación del sábado en Inicio, miniaturas y "Preparar sin internet": P5.
- La galería de desarrollo (`src/dev/`, fuera del build) conserva su `<style>`; si se toca, pasa a Tailwind.
- Cuentas, `createdBy`/`updatedBy` y sincronización: paso 8.
