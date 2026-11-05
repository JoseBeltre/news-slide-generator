# P10 · Configuración y exportar/importar — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** una página Configuración (valores por defecto, textos, Equipo, Almacenamiento) y la posibilidad de exportar un anuncio o una presentación a un `.zip` y de importarlo con una pantalla de revisión.

**Architecture:**
- La lógica vive en `src/data/` y es pura o recibe la `AppDb`:
  - `saveSettings` en `settings.ts`.
  - `src/data/transfer/` con `format`, `pack`, `unpack`, `plan` y `apply`.
- La interfaz son dos funcionalidades nuevas:
  - `src/features/settings/`, que absorbe `sync/team`.
  - `src/features/transfer/`, cuyo `shared/` usan Anuncios y Presentaciones.
- Toda escritura pasa por el repositorio o por `db.outbox`, así que se sincroniza como lo demás.

**Tech Stack:** Vue 3, Vite, TS, Dexie 4, Zod 4, Tailwind v4, Vitest (proyectos `unit` y `browser`), Playwright, y la dependencia nueva **fflate**.

**Spec:** `docs/superpowers/specs/2026-11-04-p10-configuracion-y-traspaso-design.md`

## Global Constraints

- **Copia exacta del spec:**
  - "Importar como copia", "Sobrescribir", "Ya está en este equipo", "Proteger los datos", "No se pudo consultar".
  - "Este archivo no es una exportación de Anuncios del Sábado."
  - "Falta una imagen".
  - "Se importaron N anuncios y 1 presentación".
- **Formato del archivo:**
  - `formato: 'anuncios-del-sabado'`, `version: 1`.
  - Contiene `contenido.json` e `imagenes/<hash>.<ext>`.
  - Nombres: `anuncio-<slug>.zip` (sin título: `anuncio-<typeId>.zip`) y `presentacion-<YYYY-MM-DD>.zip`.
- **Límites de tamaño:** página `*Page.vue` ≤ 80 líneas, componente ≤ 150, `.ts` ≤ 200 (`tests/unit/architecture.test.ts`).
- **Estilo de la interfaz:**
  - Solo Tailwind, sin `<style>` ni `style="…"`.
  - Todo `<button>` lleva `cursor-pointer`.
- **Dependencias entre funcionalidades:** una funcionalidad solo importa de otra lo que esté en su carpeta `shared/`. `src/ui` no importa de `app`, `features`, `data` ni `slides`.
- **Transacciones:** toda transacción Dexie que envuelva escrituras del repositorio incluye `db.outbox`.
- **Herramientas:** pnpm.
- **Commits:**
  - En español, con los IDs del SRS.
  - Terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - HANDOFF.md se actualiza en el commit de la última tarea.
- **Dónde va cada prueba:**
  - Las que usan Blob e IndexedDB reales van en `tests/browser/**`.
  - Las puras, o las de Dexie sin Blobs, van en `tests/unit/**` con `fake-indexeddb/auto`.

## Decisiones de este plan (sobre el spec)

1. **Al terminar de importar no se navega sola.** La pantalla de importar pasa a "hecho" y muestra el resumen ("Se importaron 3 anuncios y 1 presentación") con un botón **Abrir la presentación** o **Abrir el anuncio**. Así el mensaje no se pierde al cambiar de página y no hay que añadir avisos globales.
2. **El código de Equipo se mueve.** `src/features/sync/team/` pasa a `src/features/settings/team/`, y `TeamPage` se convierte en `TeamSection`. Configuración no puede importar de `sync/` porque no es `shared/`.
3. **`DateFormatPicker.vue` y `OptionGroup.vue` se mueven.** Pasan de `announcements/editor/options/` a `announcements/shared/` para que Configuración los reutilice.
4. **Uso en la nube.** `SyncRemote` gana `usedBytes(): Promise<number>`: suma `metadata.size` de los objetos del bucket `images` bajo el prefijo `images`, por páginas de 1000.
5. **Se remapean también los ids de imagen dentro de `values`.** Por ejemplo, `values.imagen`. Cualquier cadena de `values` que sea un id de imagen del archivo se cambia por el id final.

## Review Focus

1. **Dos copias del mismo título en una importación.** No pueden quedar las dos con "(2)": la segunda debe recibir "(3)".
2. **Presentación sobrescrita con anuncios copiados.** Sus `items` deben apuntar a las copias, no a los originales.
3. **Imagen ya borrada en el equipo con el mismo hash.** Se revive, no se duplica, y entra en `outbox`.
4. **`.zip` válido de otra versión, o un `.zip` cualquiera.** Error claro y nada escrito en Dexie, ni siquiera en `outbox`.
5. **Texto por defecto con solo espacios.** Se guarda el valor por defecto, no "   ".

Cada línea tiene su prueba en la tarea dueña (Tareas 1, 5 y 6).

---

### Task 1: `saveSettings`

**Files:**
- Modify: `src/data/settings.ts`
- Test: `tests/unit/data/settings.test.ts` (añadir)

**Interfaces:**
- Produces: `saveSettings(db: AppDb, patch: Partial<Omit<Settings, 'id' | 'updatedAt'>>): Promise<Settings>`. Mezcla el registro actual (o `DEFAULT_SETTINGS`) con `patch` y lo guarda con `createRepository(db.settings)` bajo `SETTINGS_ID`. Para `coverTitle` y `birthdayDefaultMessage`: se recortan los espacios y, si quedan vacíos, se guarda el valor de `DEFAULT_SETTINGS`.

- [ ] **Step 1: pruebas que fallan**
  - `saveSettings guarda el cambio y lo deja en outbox`: `saveSettings(db, { currency: 'USD' })`. Esperado: `loadSettings(db).currency === 'USD'`, el resto igual a `DEFAULT_SETTINGS`, y `db.outbox.toArray()` igual a `[{ table: 'settings', id: 'configuracion' }]`.
  - `un segundo cambio conserva el primero`: `{ currency: 'USD' }` y luego `{ timeFormat: '24h' }` dan los dos valores.
  - `texto vacío o con espacios vuelve al valor por defecto`: `{ coverTitle: '   ' }` da `coverTitle === 'Anuncios'`, y `{ birthdayDefaultMessage: '' }` da `'¡Feliz cumpleaños!'`.
  - `recorta los textos`: `{ coverTitle: '  Avisos  ' }` da `'Avisos'`.
- [ ] **Step 2:** `pnpm vitest run --project unit tests/unit/data/settings.test.ts`. Esperado: FAIL, `saveSettings` no existe.
- [ ] **Step 3:** implementar `saveSettings`. Actualizar el comentario de la cabecera, porque ya existe la pantalla.
- [ ] **Step 4:** el mismo comando. Esperado: PASS.
- [ ] **Step 5:** commit `feat(config): guardar la configuración con valores por defecto para los textos [RF-111]`.

### Task 2: página Configuración (slides, textos, equipo) y rutas

**Files:**
- Create:
  - `src/features/settings/SettingsPage.vue`
  - `src/features/settings/SettingsSection.vue`: `<section :id aria-labelledby>` con su `<h2>` y un slot.
  - `src/features/settings/SlidesSection.vue`
  - `src/features/settings/TextsSection.vue`
  - `src/features/settings/useSettings.ts`
- Move:
  - `src/features/sync/team/{AddEditorForm.vue,EditorRow.vue,useTeam.ts}` → `src/features/settings/team/`
  - `TeamPage.vue` → `src/features/settings/team/TeamSection.vue`
  - `src/features/announcements/editor/options/{DateFormatPicker.vue,OptionGroup.vue}` → `src/features/announcements/shared/`, actualizando los imports de `SlideOptions.vue`.
- Modify:
  - `src/app/router.ts`
  - `src/app/AppHeader.vue`
  - `src/features/sync/SyncPanel.vue`
- Test:
  - `tests/browser/features/settings.test.ts` (nuevo)
  - `tests/browser/features/sync/pages.test.ts`: importa `TeamSection` desde la ruta nueva; el enlace de Entrar pasa a ser `/entrar?volver=/configuracion`.
  - `tests/browser/features/sync/SyncIndicator.test.ts`: espera `a[href="/configuracion#equipo"]`.
  - Cualquier otra prueba que mencione `/equipo` o `sync/team` (`grep -rn "equipo\|sync/team" tests`), actualizada a la ruta nueva.

**Interfaces:**
- Consumes: `saveSettings` (Task 1), `loadSettings`, `DEFAULT_SETTINGS`, `SETTINGS_ID`, y `StylePicker`, `DateFormatPicker` y `PRESET_THEMES`.
- Produces:
  - `useSettings(): { settings: Readonly<Ref<Settings>>; save(patch): Promise<void> }`, con `useLiveQuery(() => loadSettings(db))`.
  - Rutas:
    - `{ path: '/configuracion', name: 'configuracion' }`.
    - `{ path: '/equipo', redirect: { path: '/configuracion', hash: '#equipo' } }`.
    - `scrollBehavior(to)` en `createAppRouter` devuelve `{ el: to.hash }` si hay hash; si no, `{ top: 0 }`.

**Contenido:**
- **SlidesSection** (`id="slides"`, título "Presentaciones y slides"):
  - `StylePicker`, con label "Estilo de slide".
  - Tema con `UiChoiceGroup` y las opciones `PRESET_THEMES` con su `swatch: t.background`. Label "Tema de color".
  - `DateFormatPicker`, con los modelos y `defaults` tomados de la configuración y `sampleDate` igual a hoy.
  - Hora segmentada: `12h` "12 horas" y `24h` "24 horas". Label "Formato de la hora".
  - Moneda segmentada: `DOP` "RD$" y `USD` "US$". Label "Moneda".
  - Cada cambio llama a `save`.
- **TextsSection** (`id="textos"`, título "Textos por defecto"):
  - Dos `UiField` + `UiInput`: "Título de la portada" y "Mensaje de cumpleaños".
  - Se guardan en `change`, al salir del campo o con Enter.
  - Después de guardar, el campo muestra lo guardado. Así, uno vacío vuelve a mostrar el valor por defecto.
- **TeamSection** (`id="equipo"`):
  - Sin `UiPageHeader`: el título lo pone `SettingsSection` ("Equipo") y "Cerrar sesión" va dentro de la sección.
  - No se monta si `useSync().value === null`.
  - El índice tampoco muestra el enlace a Equipo en ese caso.
- **Página:**
  - `UiPageHeader title="Configuración"`.
  - Un índice `nav aria-label="Secciones"` con enlaces `#slides`, `#textos`, `#equipo` y `#almacenamiento`. El de almacenamiento se añade en la Task 3.
- **AppHeader:** un enlace más al final de `LINKS`, `{ name: 'configuracion' }`, con el icono `Settings` de `@lucide/vue` y el texto "Configuración".
- **SyncPanel:** el botón "Equipo" lleva a `/configuracion#equipo`.

- [ ] **Step 1: pruebas que fallan** en `settings.test.ts`, con `mountApp('/configuracion', testDb())`:
  - `elegir US$ guarda la moneda y entra en outbox`: clic en "US$". Esperado: `(await loadSettings(db)).currency === 'USD'` y la entrada `{ table: 'settings', id: 'configuracion' }` en `outbox`.
  - `elegir Cartel cambia el estilo por defecto`: `slideStyle === 'cartel'`.
  - `elegir 24 horas guarda timeFormat` y `elegir un tema guarda defaultThemeId === 'vino'`.
  - `vaciar el título de la portada vuelve a "Anuncios"`: `setValue('')` + `change`. Esperado: guardado `'Anuncios'` y el input muestra `'Anuncios'`.
  - `sin nube no aparece Equipo`: no hay `#equipo` ni el enlace "Equipo" en el índice.
  - `/equipo redirige a /configuracion#equipo`: `router.currentRoute.value.fullPath === '/configuracion#equipo'`.
  - `el encabezado enlaza a Configuración`: `a[href="/configuracion"]` dentro de `nav[aria-label="Principal"]`.
- [ ] **Step 2:** `pnpm vitest run --project browser tests/browser/features/settings.test.ts`. Esperado: FAIL, no hay ruta.
- [ ] **Step 3:** hacer los movimientos con `git mv` y actualizar los imports de `pages.test.ts` y `SlideOptions.vue`. Luego implementar la ruta, las secciones, `useSettings`, el encabezado y SyncPanel.
- [ ] **Step 4:** correr el mismo test, `pnpm vitest run --project browser tests/browser/features/sync` y `pnpm vitest run --project unit tests/unit/architecture.test.ts`. Esperado: todo PASS.
- [ ] **Step 5:** commit `feat(config): página Configuración con valores por defecto, textos y equipo [RF-110, RF-111, §8.5]`.

### Task 3: Almacenamiento

**Files:**
- Create:
  - `src/lib/bytes.ts`
  - `src/features/settings/StorageSection.vue`
  - `src/features/settings/useStorageInfo.ts`
- Modify:
  - `src/data/sync/types.ts`
  - `src/data/sync/supabaseRemote.ts`
  - `tests/unit/data/sync/memoryRemote.ts`
  - `SettingsPage.vue`: sección e índice.
- Test:
  - `tests/unit/lib/bytes.test.ts`
  - `tests/unit/data/sync/supabase.test.ts` (añadir)
  - `tests/browser/features/settings.test.ts` (añadir)

**Interfaces:**
- Produces:
  - `formatBytes(n: number): string`. Base 1024, unidades `B`, `KB`, `MB`, `GB`, `Intl.NumberFormat('es-DO', { maximumFractionDigits: 1 })`.
  - `SyncRemote.usedBytes(): Promise<number>`:
    - En Supabase, `client.storage.from('images').list('images', { limit: 1000, offset })` en bucle hasta recibir menos de 1000, sumando `metadata?.size ?? 0`. Un error pasa por `classify`.
    - En memoria, la suma de `blob.size` de `files`.
  - `CLOUD_QUOTA_BYTES = 1024 ** 3` en `useStorageInfo.ts`.
  - `useStorageInfo()` devuelve:
    - `local: Ref<{ used: number } | null>`
    - `persisted: Ref<boolean | null>`
    - `protect(): Promise<void>`
    - `protectResult: Ref<'ok' | 'denegado' | null>`
    - `cloud: Ref<{ used: number } | 'error' | null>`. Es `null` sin sesión o mientras carga.
  - Todo `navigator.storage` es opcional (`?.`). Si falta, `local` y `persisted` quedan `null` y la sección dice "Este navegador no informa el espacio usado".

**Contenido de StorageSection** (`id="almacenamiento"`, título "Almacenamiento"):
- "En este equipo: 12,3 MB usados".
- "Los datos están protegidos", o bien el botón **Proteger los datos**. Tras pulsarlo: "Listo: el navegador no los borrará" u "El navegador no lo permitió. Instala la app o úsala más seguido."
- Con sesión: "En la nube: 120 MB de 1 GB", o "No se pudo consultar".

- [ ] **Step 1: pruebas que fallan**
  - `formatBytes`: `0` da `'0 B'`, `1536` da `'1,5 KB'` y `5 * 1024 ** 2` da `'5 MB'`. Antes de fijar el separador, comprobar el que da `es-DO`: el test usa `new Intl.NumberFormat('es-DO').format(1.5)` para el esperado.
  - `usedBytes suma las páginas`: un cliente falso cuyo `list` devuelve 1000 objetos de 10 bytes y luego 5. Esperado: `10005`, con dos llamadas de offset 0 y 1000.
  - `usedBytes traduce el error`: `list` con `{ error: { message: 'x', statusCode: '500' } }` rechaza con un `SyncError` de `kind === 'server'`.
  - En el navegador, con `navigator.storage` sustituido por `{ estimate: async () => ({ usage: 2048 }), persisted: async () => false, persist: async () => true }` (`vi.stubGlobal` o `Object.defineProperty`):
    - Se ve "2 KB".
    - Pulsar "Proteger los datos" muestra "Listo".
    - Sin sync no aparece "En la nube".
    - Con un contexto de sync falso con sesión y `remote.usedBytes` que da `5 * 1024 ** 2`, se ve "5 MB de 1 GB".
    - Si `usedBytes` rechaza, se ve "No se pudo consultar".
- [ ] **Step 2:** `pnpm vitest run --project unit tests/unit/lib/bytes.test.ts tests/unit/data/sync/supabase.test.ts` y `pnpm vitest run --project browser tests/browser/features/settings.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** los mismos comandos y `pnpm typecheck`, porque `memoryRemote` y los falsos tienen que cumplir la interfaz. Esperado: PASS.
- [ ] **Step 5:** commit `feat(config): almacenamiento en este equipo y en la nube, con "Proteger los datos" [RF-102]`.

### Task 4: formato del archivo, exportar y leer el `.zip`

**Files:**
- Create:
  - `src/lib/slug.ts`
  - `src/data/transfer/format.ts`
  - `src/data/transfer/pack.ts`
  - `src/data/transfer/unpack.ts`
- Modify: `package.json` (`pnpm add fflate`)
- Test:
  - `tests/unit/lib/slug.test.ts`
  - `tests/browser/data/transfer.test.ts` (nuevo)

**Interfaces:**
- `slugify(text: string): string`:
  - Pasa a minúsculas y quita los acentos (NFD sin diacríticos).
  - Cambia todo lo que no sea `[a-z0-9]` por `-`, colapsa los guiones y los quita de los extremos.
  - Corta a 40 caracteres.
- `format.ts`:
  - `TRANSFER_FORMAT = 'anuncios-del-sabado'` y `TRANSFER_VERSION = 1`.
  - `interface TransferFile`, como en el spec §2.
  - `transferFileSchema` con Zod 4:
    - `z.looseObject` por entidad, con los campos que usa la app: los de `Announcement`, `Presentation` e `ImageAsset`.
    - `typeId` debe ser de `ANNOUNCEMENT_TYPES`.
    - `hash` cumple `/^[0-9a-f]{64}$/`.
    - Con `superRefine`: si `tipo` es `'anuncio'`, hay exactamente 1 anuncio y ninguna presentación; si es `'presentacion'`, hay presentación.
  - `interface TransferBundle { content: TransferFile; blobs: Map<string /* hash */, Blob> }`.
  - `class TransferFormatError extends Error`, con el mensaje "Este archivo no es una exportación de Anuncios del Sábado."
- `pack.ts`:
  - `exportAnnouncement(db: AppDb, id: string, now?: Date): Promise<{ name: string; blob: Blob }>`.
  - `exportPresentation(db: AppDb, id: string, now?: Date): Promise<{ name: string; blob: Blob }>`.
  - En la presentación van los anuncios vivos de `items`, en su orden y sin repetir, y en el JSON se quitan de `items` los que no estén vivos.
  - Las imágenes son la unión de los `imageIds`. Cada Blob local va en `imagenes/<hash>.<ext>`, con la extensión de `storagePath`.
  - `zipSync`: `contenido.json` comprimido y las imágenes con `level: 0`. El Blob tiene tipo `application/zip`.
  - Si el anuncio o la presentación no existe, lanza `Error('No existe')`.
- `unpack.ts`:
  - `readTransferFile(file: Blob): Promise<TransferBundle>`.
  - `unzipSync`, con un filtro que solo acepta `contenido.json` e `imagenes/*`.
  - El tipo MIME sale de la extensión: `webp`, `svg` (`image/svg+xml`), `png` y `jpg`/`jpeg`.
  - Cualquier fallo lanza `TransferFormatError`: zip roto, falta el JSON, JSON inválido o `safeParse` falla.

- [ ] **Step 1: pruebas que fallan**
  - Slug: `'Culto de Jóvenes'` da `'culto-de-jovenes'`, `'¡¡Hola!!'` da `'hola'`, y 60 «a» dan 40.
  - Navegador:
    - `exportar y leer un anuncio devuelve lo mismo`: anuncio con `seed` + `saveImage(db, await syntheticFlyer(400, 300), 'flyer')`, con `imageIds` y `values.imagen` iguales a ese id. Esperado:
      - `name === 'anuncio-<slug-del-titulo>.zip'`.
      - `readTransferFile(blob)` da `content.announcements[0]` igual al guardado, `content.images[0].hash` igual al del asset, y `blobs.get(hash).size` igual al del Blob guardado.
    - `anuncio sin título se llama anuncio-<typeId>.zip`.
    - `exportar una presentación incluye sus anuncios vivos en orden`: 3 items, uno borrado. Esperado: 2 anuncios en orden, `presentation.items` de longitud 2 y `name === 'presentacion-<fecha>.zip'`.
    - `un zip cualquiera da TransferFormatError` (zip con `hola.txt`).
    - `version 2 da TransferFormatError` y `tipo anuncio con 2 anuncios da TransferFormatError`.
    - `si falta el Blob se exporta igual`: `content.images` tiene la imagen y `blobs` no tiene su hash.
- [ ] **Step 2:** `pnpm vitest run --project unit tests/unit/lib/slug.test.ts` y `pnpm vitest run --project browser tests/browser/data/transfer.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** `pnpm add fflate` e implementar.
- [ ] **Step 4:** los mismos comandos. Esperado: PASS.
- [ ] **Step 5:** commit `feat(traspaso): exportar un anuncio o una presentación a .zip y leerlo [RF-112]`.

### Task 5: plan de importación (puro, contra Dexie)

**Files:**
- Create: `src/data/transfer/plan.ts`
- Test: `tests/unit/data/transferPlan.test.ts` (`fake-indexeddb`; bundles en memoria con `blobs: new Map()`)

**Interfaces:**
- Consumes: `TransferBundle` (Task 4) y `displayTitle`.
- Produces:
  ```ts
  export type Resolution = 'copia' | 'sobrescribir'
  export interface PlannedAnnouncement { id: string; typeId: string; title?: string; exists: boolean; resolution: Resolution; included: boolean }
  export interface PlannedPresentation { id: string; date: string; exists: boolean; resolution: Resolution; targetDate: string }
  export interface ImportPlan {
    bundle: TransferBundle
    announcements: PlannedAnnouncement[]
    presentation?: PlannedPresentation
    /** Imágenes del archivo sin su Blob. */
    missingImages: number
    /** Títulos vivos del equipo y fecha → id de la presentación viva. */
    taken: { titles: string[]; dates: Record<string, string> }
  }
  export function planImport(db: AppDb, bundle: TransferBundle): Promise<ImportPlan>
  export function copyTitle(title: string, taken: ReadonlySet<string>): string   // primer `${title} (n)` libre, n ≥ 2
  export function dateConflict(plan: ImportPlan): boolean
  export function canApply(plan: ImportPlan): boolean
  ```
- Reglas:
  - `exists` es true si hay un registro vivo con ese id.
  - Por defecto, `resolution` es `'copia'` e `included` es `true`.
  - `targetDate` empieza igual a `date`.
  - `dateConflict`: `taken.dates[targetDate]` existe y la presentación no está en `sobrescribir` sobre ese mismo id. Dicho de otro modo, hay conflicto si `taken.dates[targetDate]` existe y no es (`exists` && `resolution === 'sobrescribir'` && `taken.dates[targetDate] === id`).
  - `canApply`: no hay `dateConflict` y hay algo que importar (presentación o algún anuncio incluido).

- [ ] **Step 1: pruebas que fallan**
  - `un anuncio nuevo entra tal cual`: `exists: false`, `resolution: 'copia'`, `included: true`.
  - `un anuncio que ya está se marca exists`, y uno **borrado** en el equipo cuenta como `exists: false`.
  - `copyTitle`:
    - `('Culto', {'Culto'})` da `'Culto (2)'`.
    - `('Culto', {'Culto','Culto (2)'})` da `'Culto (3)'`.
    - `('Culto', {})` da `'Culto (2)'`: la copia siempre lleva sufijo.
  - `presentación en una fecha ocupada`:
    - `dateConflict === true` y `canApply === false`.
    - Con `targetDate` libre, ambos se invierten.
    - Con `exists` + `'sobrescribir'` sobre la misma fecha, no hay conflicto.
  - `missingImages cuenta las imágenes sin Blob`.
  - `sin anuncios incluidos ni presentación, canApply es false`.
- [ ] **Step 2:** `pnpm vitest run --project unit tests/unit/data/transferPlan.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** el mismo comando. Esperado: PASS.
- [ ] **Step 5:** commit `feat(traspaso): plan de importación con copia, sobrescribir y fecha ocupada [RF-112]`.

### Task 6: aplicar la importación

**Files:**
- Create: `src/data/transfer/apply.ts`
- Test: `tests/browser/data/transfer.test.ts` (añadir). Exporta desde una `AppDb` e importa en otra `testDb()`, o en la misma para los casos de "ya está".

**Interfaces:**
- Consumes: `ImportPlan`, `copyTitle` y `dateConflict` (Task 5).
- Produces:
  - `interface ImportResult { announcementIds: string[]; presentationId?: string }`.
  - `applyImport(db: AppDb, plan: ImportPlan): Promise<ImportResult>`. Si `!canApply(plan)`, lanza un error.
  - `importSummary(r: ImportResult): string`:
    - "Se importó 1 anuncio".
    - "Se importaron 3 anuncios".
    - "Se importaron 3 anuncios y 1 presentación".
    - "Se importó 1 anuncio y 1 presentación".
    - Con 0 anuncios: "Se importó 1 presentación".
- Algoritmo, en una sola `db.transaction('rw', [announcements, presentations, images, imageBlobs, outbox])`:
  1. **Imágenes** de los anuncios incluidos. Mapa `idDelArchivo → idFinal`:
     - Si hay una imagen viva con el mismo hash, se usa su id.
     - Si hay una borrada con ese hash, se revive (`deletedAt: null`, `updatedAt` ahora). Su Blob se guarda si viene.
     - Si no hay ninguna, se guarda el registro con el id del archivo, o uno nuevo si ese id ya está ocupado, y su Blob si viene.
     - Cada registro guardado o revivido deja `{ table: 'images', id }` en `outbox`.
  2. **Anuncios incluidos:**
     - Con `exists` y `'copia'`: id nuevo. El título recibe `copyTitle` en `values.titulo` o, si no hay, en `values.tituloInterno`. Si no hay ninguno de los dos, no cambia. El conjunto `taken` crece con cada título asignado.
     - En cualquier otro caso se usa el mismo id.
     - En todos se remapean los ids de imagen en `imageIds` y en las cadenas de `values`, de forma recursiva.
     - Se guardan con `createRepository(db.announcements).put`, que pone `updatedAt` y añade la entrada en `outbox`.
  3. **Presentación:**
     - Con `exists` y `'copia'` lleva id nuevo; si no, el mismo.
     - `date` es `targetDate`.
     - `items` se filtra a los anuncios incluidos y se remapea a sus ids finales.
     - Se guarda con el repositorio.
  4. Si algo lanza un error, Dexie revierte la transacción y el error sube.

- [ ] **Step 1: pruebas que fallan**
  - `ida y vuelta de un anuncio con imagen en otro equipo`: en una db B vacía, aplicar. Esperado:
    - El anuncio tiene el mismo id y los mismos `values`.
    - La imagen existe en B con su Blob.
    - `outbox` contiene `announcements:<id>` e `images:<id>`.
  - `copia en el mismo equipo`: el id es distinto y el título es "Culto (2)". Importar otra vez da "Culto (3)".
  - `dos anuncios con el mismo título en una presentación copiada`: quedan "(2)" y "(3)", no dos "(2)".
  - `anuncio de imagen sin título se copia sin cambiar values`, salvo el remapeo.
  - `sobrescribir conserva el id`: `values` sale del archivo y `updatedAt` es posterior al anterior.
  - `presentación sobrescrita con anuncios copiados`: sus `items` apuntan a las copias.
  - `desmarcar un anuncio`: no se crea y se quita de `items`.
  - `imagen con el mismo hash se reutiliza`: `db.images.count()` no cambia y `imageIds` apunta al id existente.
  - `imagen borrada con el mismo hash se revive y entra en outbox`.
  - `fecha ocupada sin cambiar`: `applyImport` rechaza y no cambia nada (`announcements.count()` y `outbox.count()` iguales).
  - `error a mitad no deja nada`: espiar `db.presentations.put` para que lance. Esperado: ni anuncios ni imágenes nuevos, y `outbox` sin cambios.
  - `importSummary` con los cinco casos.
- [ ] **Step 2:** `pnpm vitest run --project browser tests/browser/data/transfer.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar `apply.ts`. Si pasa de 200 líneas, `remapImageIds` y la parte de imágenes van a `src/data/transfer/images.ts`.
- [ ] **Step 4:** el mismo comando. Esperado: PASS.
- [ ] **Step 5:** commit `feat(traspaso): aplicar la importación en una transacción, con imágenes por hash [RF-112]`.

### Task 7: botones Exportar

**Files:**
- Create:
  - `src/features/transfer/shared/ExportButton.vue`
  - `src/features/transfer/shared/download.ts`
- Modify:
  - `src/features/announcements/shared/AnnouncementRow.vue`
  - `src/features/announcements/editor/AnnouncementEditor.vue`
  - `src/features/presentations/detail/PresentationPage.vue`
- Test: `tests/browser/features/export.test.ts` (nuevo)

**Interfaces:**
- `downloadBlob(name: string, blob: Blob): void`: crea un `<a download>` temporal con `URL.createObjectURL`, hace clic y revoca la URL en el siguiente tick.
- `ExportButton` recibe las props `{ kind: 'anuncio' | 'presentacion'; id: string; label: string; icon?: boolean }`:
  - Con `icon` es un `UiIconButton` con el icono `Download` y `label` como aria-label; sin `icon`, un `UiButton` con el icono y el texto "Exportar".
  - Llama a `exportAnnouncement` o `exportPresentation` con `useDb()` y después a `downloadBlob`.
  - Si falla, muestra `role="alert"`: "No se pudo exportar."
- Dónde va:
  - **Fila:** entre Duplicar y Eliminar, `label` = `Exportar «${name}»`.
  - **Editor:** en el encabezado, antes de Guardar, solo si `initial.id` existe. Exporta lo guardado.
  - **Presentación:** dentro de `UiPageHeader`. Si la página pasa de 80 líneas, extraer `move`, `removeAt` y `add` a `usePresentationEdits.ts` en `detail/`.

- [ ] **Step 1: pruebas que fallan**, espiando `URL.createObjectURL` y `HTMLAnchorElement.prototype.click`:
  - `la fila exporta el anuncio`: en `/anuncios`, clic en "Exportar «Culto»". Esperado: el `<a>` lleva `download === 'anuncio-culto.zip'` y el Blob es de tipo `application/zip`.
  - `el editor de un anuncio guardado tiene Exportar` y `uno nuevo no lo tiene`.
  - `la presentación exporta presentacion-<fecha>.zip`.
- [ ] **Step 2:** `pnpm vitest run --project browser tests/browser/features/export.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** el mismo comando, más `tests/browser/features/announcements-list.test.ts`, `presentation-detail.test.ts` y `tests/unit/architecture.test.ts`. Esperado: PASS.
- [ ] **Step 5:** commit `feat(traspaso): Exportar en la lista, el editor y la presentación [RF-112]`.

### Task 8: Importar (botón, revisión, hecho) + E2E + documentación

**Files:**
- Create:
  - `src/features/transfer/shared/ImportButton.vue`
  - `src/features/transfer/shared/pendingImport.ts`
  - `src/features/transfer/import/ImportPage.vue`
  - `src/features/transfer/import/ImportReview.vue`
  - `src/features/transfer/import/PresentationChoice.vue`
  - `src/features/transfer/import/ImportItem.vue`
  - `src/features/transfer/import/ImportDone.vue`
  - `src/features/transfer/import/useImport.ts`
  - `tests/e2e/traspaso.spec.ts`
- Modify:
  - `src/app/router.ts` (`{ path: '/importar', name: 'importar' }`)
  - `AnnouncementsPage.vue`
  - `PresentationsPage.vue`
  - `HANDOFF.md`
  - `README.md`, sección "Exportar e importar"
- Test: `tests/browser/features/import.test.ts` (nuevo)

**Interfaces:**
- `pendingImport.ts`:
  - `pendingImport: ShallowRef<{ bundle: TransferBundle } | { error: string } | null>`, a nivel de módulo, en memoria.
  - `setPendingImport(v)`.
- `ImportButton`:
  - Es un `UiButton` "Importar" con el icono `Upload` y un `<input type="file" accept=".zip,application/zip" class="sr-only">`.
  - Al elegir un archivo llama a `readTransferFile`, guarda en `pendingImport` el bundle o `{ error: e.message }` y hace `router.push({ name: 'importar' })`.
  - Si el error no es `TransferFormatError`, el mensaje es "No se pudo leer el archivo."
- `useImport()` devuelve:
  - `plan: Ref<ImportPlan | null>`
  - `error: Ref<string | null>`
  - `done: Ref<ImportResult | null>`
  - `setResolution(id, r)`, `toggle(id)`, `setPresentationResolution(r)`, `setTargetDate(d)`
  - `apply(): Promise<void>`. Si falla, pone `error` con el mensaje y deja el plan.
  - Al montar lee `pendingImport` y, si hay bundle, calcula `planImport`.
  - Cada mutador crea un plan nuevo (inmutable).
- Pantalla:
  - **Sin pendiente:** `UiEmptyState` con "Elige un archivo exportado de Anuncios del Sábado." y un `ImportButton`.
  - **Error:** `UiBanner tone="danger"` con el mensaje y un `ImportButton` ("Elegir otro archivo").
  - **Revisión:**
    - `PresentationChoice` si hay presentación: la fecha con `formatDate`, `UiBadge` "Ya está en este equipo" y `UiChoiceGroup` segmentado "Importar como copia" / "Sobrescribir".
    - Si hay `dateConflict`, un aviso "Ya hay una presentación el {fecha}. Elige otra fecha." y `UiInput type="date"` con la etiqueta "Otra fecha".
    - La lista `ImportItem`: `UiCheckbox` solo si el archivo es una presentación, el título (o "Sin título") con el tipo, y el badge con la elección si `exists`.
    - `UiBanner` si `missingImages`: "Falta una imagen" o "Faltan N imágenes", seguido de ": esas slides saldrán sin ella."
    - Botones: **Importar** (primario, `disabled` si `!canApply`) y **Cancelar** (vuelve atrás o a `/anuncios`).
  - **Hecho:** `ImportDone` con `importSummary(done)` (`role="status"`) y **Abrir la presentación** (`{ name: 'presentacion' }`) o **Abrir el anuncio** (`{ name: 'editar' }`, el primero importado).
- Al montar, `ImportPage` vacía `pendingImport` después de leerlo, así que recargar la página vuelve a pedir el archivo.

- [ ] **Step 1: pruebas que fallan** en `import.test.ts`, con `setPendingImport({ bundle })` y `mountApp('/importar', db)`; el bundle sale de `exportAnnouncement` y `readTransferFile`:
  - `un anuncio que ya está muestra "Ya está en este equipo" y copia por defecto`. Al pulsar Importar se ve "Se importó 1 anuncio" y existe "Culto (2)".
  - `cambiar a Sobrescribir conserva el id`: sigue habiendo 1 anuncio y "Abrir el anuncio" lleva a `/anuncios/<id original>`.
  - `en una presentación, desmarcar un anuncio lo excluye`.
  - `fecha ocupada`: Importar está deshabilitado. Tras poner otra fecha se habilita, y al importar existe la presentación en la fecha nueva.
  - `error de formato`: con `{ error: 'Este archivo no es…' }` se ve el texto y "Elegir otro archivo".
  - `sin archivo pendiente`: se ve "Elige un archivo exportado…".
  - `Anuncios y Presentaciones tienen el botón Importar`.
- [ ] **Step 2:** `pnpm vitest run --project browser tests/browser/features/import.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** el mismo comando y `tests/unit/architecture.test.ts`. Esperado: PASS.
- [ ] **Step 5: E2E** `tests/e2e/traspaso.spec.ts`:
  1. Crear un anuncio "Culto" con la interfaz, como las otras E2E de `anuncios.spec.ts`.
  2. En `/anuncios`, `page.waitForEvent('download')` al pulsar "Exportar «Culto»" y guardar el archivo en `testInfo.outputPath`.
  3. Pulsar "Importar" y hacer `setInputFiles` en el input con ese archivo.
  4. Comprobar que se ve "Ya está en este equipo", pulsar Importar y comprobar que se ve "Se importó 1 anuncio".
  5. En `/anuncios` existe "Culto (2)".

  Run: `pnpm test:e2e tests/e2e/traspaso.spec.ts`. Esperado: PASS.
- [ ] **Step 6: suite completa**: `pnpm typecheck`, `pnpm test` y `pnpm test:e2e`. Esperado: todo verde, salvo fallos ajenos, que se anotan por nombre.
- [ ] **Step 7: documentación.**
  - `README.md`: Configuración, y Exportar e importar (qué incluye el archivo, la copia frente a sobrescribir, y que los ministerios no viajan).
  - `HANDOFF.md`: estado, la siguiente tarea (P9: lectura pública + OG) y la fila del log de tareas.
- [ ] **Step 8:** commit `feat(traspaso): importar con pantalla de revisión; documentación [§11 paso 10, RF-112]`.
