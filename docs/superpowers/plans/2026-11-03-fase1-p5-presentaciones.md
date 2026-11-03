# P5 · Presentaciones: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paso 6 de SRS §11. El equipo arma la presentación del sábado: la crea con los anuncios sugeridos, los ordena arrastrando o con botones, activa la portada y el cierre, ve las miniaturas con el conteo de slides y pulsa "Preparar sin internet", que comprueba en el equipo todo lo necesario y muestra "✓ Lista para usar sin internet" o dice qué falta. "Presentar" llega en P6.

**Architecture:** Se sigue la organización de P4. Las reglas son funciones puras en `src/data/presentations.ts`. La comprobación sin internet está en `src/data/offline.ts`: es pura y recibe el entorno del navegador inyectado; el entorno real vive en `src/data/offlineEnv.ts`. Las pantallas van en `src/features/presentations/`. La lista ordenable es un control genérico, `src/ui/UiSortableList.vue`, que se puede arrastrar y tiene botones subir/bajar. Las miniaturas reutilizan `SlideView` (P3) dentro de un contenedor 16:9, como la vista previa. `useSlideContext` pasa de `features/announcements/editor/` a `src/data/`, porque ahora lo usan dos funcionalidades, y acepta la fecha de la presentación.

**Tech Stack:** el mismo de P1–P4. No se agregan dependencias: el arrastre usa el Drag and Drop nativo de HTML5. En el celular basta con los botones subir/bajar, porque se arma la presentación sobre todo en la laptop.

**Spec:** `SRS.md` v1.5:
- §3.4: RF-50…RF-55;
- §3.10: RF-102;
- §6, pantallas 1 y 4;
- §7: `Presentation`;
- §10.1: criterio 1 (sin internet).

Hoja de ruta: `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md` (P5). Diseño de la interfaz: `DESIGN.md`.

Lo que consume de P2–P4:
- `buildSlides`, `frameSlide` y `SlideView` (estado `ok` / `no_cabe` / `midiendo`);
- `referenceDate`;
- `listMinistries`, `getImageBlob`;
- `filterAnnouncements`, `displayTitle`, `isPast`;
- `useDb`, `useLiveQuery`, `createRepository`, `plainCopy`;
- controles `Ui*` y `useConfirm`.

## Global Constraints

Se aplican **todas las de P4** sin cambios: HANDOFF, pnpm, Tailwind estricto, tamaños de archivo, nada duplicado, nombres, offline, usuarios, español, commits y push. Las hace cumplir `tests/unit/architecture.test.ts`. Además:

- **Una presentación por fecha.** "Crear" para una fecha que ya tiene presentación abre la existente.
- **Por defecto, el próximo sábado**, o hoy si hoy es sábado (RF-50).
- **Sugerencias (RF-52):** anuncios no borrados, con estado `listo` y `eventDate >= fecha de la presentación`, ordenados por `eventDate`. Los cumpleaños y los anuncios sin fecha no se sugieren, pero se pueden agregar a mano.
- **Portada y cierre (RF-53):** vienen activados al crear. El título de la portada se puede cambiar por presentación (`coverTitle`); si se deja vacío, se usa `settings.coverTitle`.
- **"No cabe" bloquea (hoja de ruta):** si un anuncio está en `no_cabe` o `borrador`, o su miniatura mide `no_cabe` con la fecha de la presentación, la presentación **no** queda lista. Esto se avisa por anuncio y con un enlace a editarlo.
- **RF-102:** "Preparar sin internet" llama a `navigator.storage.persist()`. Si el navegador lo niega (por ejemplo Brave), sale un aviso, pero eso no impide que la presentación quede lista.
- **RNF-10:** si un anuncio está eliminado, la presentación no deja un hueco: lo muestra como "Anuncio eliminado" con el botón "Quitar", y no genera ninguna slide.

## Review Focus

- **Anuncio borrado después de agregarlo** → su fila dice "Anuncio eliminado", no aparece ninguna miniatura y la comprobación lo reporta. Nunca aparece "undefined" ni un error. Prueba: Task 1 (`presentationSlides`) y Task 5.
- **Fechas relativas o cumpleaños que cambian con la fecha de la presentación** → las miniaturas se dibujan con `presentationDate`, no con la fecha de hoy, y un "no cabe" medido ahí bloquea la presentación. Prueba: Task 6.
- **Sin Service Worker (modo dev o primera visita sin internet)** → la comprobación dice "La app aún no está guardada en este equipo: ábrela una vez con internet", no "✓". Prueba: Task 2.
- **Reordenar con el teclado** → los botones subir/bajar mueven la fila y el foco la sigue. El primer elemento no se puede subir y el último no se puede bajar. Prueba: Task 3.
- **Dos sábados en la lista** → "Crear presentación" con una fecha que ya existe abre esa presentación y no crea un duplicado. Prueba: Task 4.

---

## Estructura de archivos

```
src/
  data/
    presentations.ts        # reglas puras: próximo sábado, sugerencias, mover, slides, problemas de contenido
    offline.ts              # comprobación sin internet, pura (recibe OfflineEnv), y sus mensajes
    offlineEnv.ts           # OfflineEnv real: persist, Service Worker, fuente, caché
    useSlideContext.ts      # MOVIDO desde features/announcements/editor/, con presentationDate opcional
  ui/
    UiSortableList.vue      # lista ordenable genérica: arrastrar + subir/bajar, slot por fila
  app/
    router.ts               # + 'presentaciones', 'presentacion'
    AppHeader.vue           # + enlace "Presentaciones"
  features/
    home/HomePage.vue       # + NextPresentationCard
    presentations/
      shared/               # lo que usan Inicio y las pantallas de presentaciones
        NextPresentationCard.vue   # "Sábado 7 de noviembre · 9 slides · ✓ Lista" o "Crear presentación"
        usePresentations.ts        # lista en vivo, crear (o abrir la existente), borrar
        useOfflineCheck.ts         # corre checkOffline con el entorno real; estado reactivo
        OfflineStatus.vue          # "✓ Lista para usar sin internet" o la lista de problemas
      list/
        PresentationsPage.vue      # próximas y pasadas + crear con fecha
        PresentationRow.vue
        NewPresentationForm.vue    # fecha (por defecto el próximo sábado) + "Crear"
      detail/
        PresentationPage.vue       # compone: encabezado, contenido, miniaturas, preparar
        usePresentationRecord.ts   # carga en vivo, guarda cambios (items, portada, cierre, título)
        PresentationItems.vue      # UiSortableList de anuncios (o "Anuncio eliminado") con Quitar
        AddAnnouncements.vue       # anuncios activos que no están, con "Agregar"
        FrameOptions.vue           # portada (con su título) y cierre
        SlideThumbnails.vue        # miniaturas + "N slides"; emite los estados medidos
        SlideThumb.vue             # una miniatura 16:9 con su estado y enlace al anuncio
```

Regla de arquitectura nueva: una funcionalidad puede importar de la carpeta `shared/` de **cualquier** otra funcionalidad, y ya no solo de `announcements/shared`. Inicio usa `presentations/shared/NextPresentationCard.vue`. El cambio se hace en Task 4, dentro de la misma prueba de arquitectura.

---

### Task 1: Reglas de las presentaciones y contexto de slides compartido

**Files:**
- Create: `src/data/presentations.ts`, `tests/unit/data/presentations.test.ts`.
- Move: `src/features/announcements/editor/useSlideContext.ts` → `src/data/useSlideContext.ts` (actualizar sus imports en el editor).
- Modify:
  - `src/data/models.ts`: `Presentation` agrega `coverTitle?: string`; sin cambio en el esquema de Dexie.
  - `HANDOFF.md`.

**Interfaces:**
- Consumes:
  - `buildSlides(a, ctx)`, `frameSlide(kind, ctx)` y `SlideContext` (P3);
  - `displayTitle`;
  - `NewRecord`.
- Produces:
  ```ts
  export type PresentationSlide = { spec: SlideSpec; announcementId?: string }   // sin id: portada o cierre
  export function nextSaturday(today: string): string                          // hoy si es sábado
  export function suggestedItems(date: string, list: Announcement[]): Presentation['items']
  export function newPresentation(date: string, list: Announcement[]): NewRecord<Presentation>
  //   items = suggestedItems, showCover/showClosing true, published false
  export function moveItem<T>(items: readonly T[], from: number, to: number): T[]  // copia; índices fuera de rango → igual
  export function presentationSlides(p: Presentation, byId: ReadonlyMap<string, Announcement>, ctx: SlideContext): PresentationSlide[]
  //   ctx con presentationDate = p.date y settings.coverTitle = p.coverTitle || settings.coverTitle;
  //   [portada] + buildSlides de cada anuncio existente y no borrado + [cierre]
  export type ContentIssue =
    | { kind: 'vacia' }
    | { kind: 'eliminado'; index: number }
    | { kind: 'borrador' | 'no_cabe'; announcementId: string; title: string }
  export function contentIssues(p: Presentation, byId: ReadonlyMap<string, Announcement>,
    measured?: ReadonlyMap<string, SlideStatus['status']>): ContentIssue[]
  //   'vacia' si no hay anuncios; title = displayTitle ?? 'Sin título'; un 'no_cabe' medido vale aunque el guardado sea 'listo'
  // useSlideContext.ts
  export function useSlideContext(presentationDate?: Ref<string | undefined>): Ref<SlideContext>
  ```

- [ ] **Step 1: pruebas que fallan** en `presentations.test.ts`.
  - **`nextSaturday`:**
    - `'2026-11-02'` (lunes) → `'2026-11-07'`;
    - `'2026-11-07'` → `'2026-11-07'`;
    - `'2026-12-27'` → `'2027-01-02'`.
  - **`suggestedItems('2026-11-07', …)`:**
    - incluye: un `listo` del 7 y uno del 20 (en ese orden);
    - excluye: un `listo` del 6, un `borrador` del 10, un `no_cabe` del 10, un borrado del 10, un cumpleaños y un aviso sin fecha.
  - **`moveItem`:**
    - `[a,b,c]` de 0 a 2 → `[b,c,a]`;
    - de 2 a 0 → `[c,a,b]`;
    - fuera de rango → igual;
    - no muta la entrada.
  - **`presentationSlides`:**
    - con portada y cierre, y 2 anuncios (uno de cumpleaños en grupo con 2 páginas) → 5 slides; el primero y el último no tienen `announcementId`;
    - sin portada → la primera es un anuncio;
    - un id que no existe o un anuncio borrado → ninguna slide;
    - `coverTitle: 'Avisos'` → la portada se dibuja con `ctx.settings.coverTitle === 'Avisos'`; con `''` se usa el de Configuración.
  - **`contentIssues`:**
    - sin items → `[{kind:'vacia'}]`;
    - un id inexistente en el índice 1 → `{kind:'eliminado', index:1}`;
    - borrador y no cabe dan su `title`; sin título → `'Sin título'`;
    - con `measured` = `no_cabe` en un anuncio guardado como `listo` → `no_cabe`.
- [ ] **Step 2:** `pnpm vitest run presentations` → FAIL (el módulo no existe).
- [ ] **Step 3: implementar.**
  - Mover `useSlideContext` con `git mv` y agregar `presentationDate` al `computed`.
  - En `presentationSlides`, el contexto se clona: `{ ...ctx, presentationDate: p.date, settings: { ...ctx.settings, coverTitle } }`.
- [ ] **Step 4:** PASS; `pnpm typecheck` → 0; `pnpm test` → todo verde (el editor sigue funcionando con el contexto movido).
- [ ] **Step 5:** commit `feat(datos): reglas de presentaciones y contexto de slides compartido [RF-50, RF-52, RF-53]`.

### Task 2: Comprobación "sin internet"

**Files:**
- Create: `src/data/offline.ts`, `src/data/offlineEnv.ts`, `tests/unit/data/offline.test.ts`, `tests/browser/data/offlineEnv.test.ts`.

**Interfaces:**
- Consumes:
  - `ContentIssue`, `contentIssues`, `presentationSlides` (Task 1);
  - `getImageBlob`;
  - `LogoSource`.
- Produces:
  ```ts
  export interface OfflineEnv {
    requestPersist(): Promise<boolean>    // navigator.storage.persist(); sin API → false
    appInstalled(): Promise<boolean>      // hay Service Worker activo controlando la página
    fontReady(family: string): Promise<boolean>   // document.fonts.load + check
    assetCached(url: string): Promise<boolean>    // data: → true; si no, caches.match(url) !== undefined
  }
  export type OfflineIssue =
    | ContentIssue
    | { kind: 'imagen'; announcementId: string; title: string }
    | { kind: 'logo'; ministry: string }
    | { kind: 'fuente' } | { kind: 'app' }
  export interface OfflineReport { ready: boolean; issues: OfflineIssue[]; persistent: boolean }
  export async function checkOffline(input: {
    presentation: Presentation; byId: ReadonlyMap<string, Announcement>; ctx: SlideContext
    measured?: ReadonlyMap<string, SlideStatus['status']>; hasImage: (id: string) => Promise<boolean>
  }, env: OfflineEnv, opts?: { persist?: boolean }): Promise<OfflineReport>
  //   ready = issues.length === 0 (persistent no cuenta); persist solo si opts.persist (el botón; Inicio no lo pide)
  export function issueMessage(issue: OfflineIssue): string
  export function browserOfflineEnv(): OfflineEnv   // offlineEnv.ts
  ```
  - **Imágenes:** los `imageId` de cada slide (`image`, fotos de cumpleaños y de las plantillas) y `a.imageIds`.
  - **Logos:** los de los ministerios elegidos en cada anuncio (`logoCandidatesFor`). Un `asset` se comprueba con `assetCached`; una `image`, con `hasImage`.
  - **Fuente:** `DEFAULT_FONT_FAMILY`.
- [ ] **Step 1: pruebas que fallan** en `offline.test.ts`, con un `OfflineEnv` falso.
  - Todo bien → `{ ready: true, issues: [] }`.
  - Falta el blob de la foto → `imagen` con el título.
  - `appInstalled` falso → `app`.
  - `fontReady` falso → `fuente`.
  - Un logo `asset` sin caché → `logo` con el nombre del ministerio.
  - `persist` solo se llama con `{ persist: true }`; si devuelve `false`, el resultado es `ready` y `persistent: false`.
  - `issueMessage` para cada tipo, con los textos exactos:
    - `app`: "La app aún no está guardada en este equipo: ábrela una vez con internet."
    - `fuente`: "Falta la letra de las slides en este equipo."
    - `imagen`: "Falta una imagen de «{title}». Ábrelo y vuelve a subirla."
    - `logo`: "Falta el logo de {ministry}."
    - `vacia`: "La presentación no tiene anuncios."
    - `eliminado`: "Hay un anuncio eliminado en la lista. Quítalo."
    - `borrador`: "«{title}» está incompleto."
    - `no_cabe`: "«{title}» no cabe en su slide."
- [ ] **Step 2: prueba de navegador que falla** (`offlineEnv.test.ts`):
  - `fontReady('Atkinson Hyperlegible')` con `src/slides/fonts` importado → true;
  - `assetCached('data:image/svg+xml,…')` → true;
  - `requestPersist()` resuelve a un booleano sin lanzar.
- [ ] **Step 3:** `pnpm vitest run offline` → FAIL.
- [ ] **Step 4: implementar.** Ningún `throw` llega a la interfaz: si una API no existe, `browserOfflineEnv` devuelve `false`.
- [ ] **Step 5:** PASS; commit `feat(datos): comprobación "Preparar sin internet" y almacenamiento persistente [RF-55, RF-102]`.

### Task 3: Lista ordenable

**Files:**
- Create: `src/ui/UiSortableList.vue`, `tests/browser/ui/UiSortableList.test.ts`.

**Interfaces:**
- Produces:
  ```ts
  // <UiSortableList :items="T[]" :item-key="(item: T) => string" label="Orden de los anuncios" @move="(from, to) => …">
  //   <template #default="{ item, index }"> … </template>
  // Cada fila: asa de arrastre (draggable), slot, UiIconButton "Subir"/"Bajar" (aria-label con el nombre de la fila
  // vía prop itemLabel(item) → "Subir «Culto joven»"). Emite move; no muta items.
  ```
- [ ] **Step 1: pruebas que fallan.**
  - Pulsar "Bajar" en la fila 0 → `move(0,1)`, y el foco queda en el "Bajar" de la misma fila en su nueva posición (cuando el padre actualiza `items`).
  - "Subir" está deshabilitado en la primera fila y "Bajar" en la última.
  - `dragstart` en la fila 2 y `drop` sobre la fila 0 → `move(2,0)`.
  - Zonas táctiles ≥ 44 px (`h-11`).
  - Es una `ol` con `aria-label`.
- [ ] **Step 2:** FAIL → implementar con Tailwind solamente: el estado de arrastre se indica con `data-dragging` y la variante `data-[dragging]:`.
- [ ] **Step 3:** PASS; `pnpm vitest run architecture` → PASS (≤ 150 líneas, sin dependencias de dominio); commit `feat(ui): lista ordenable con arrastre y botones subir/bajar [RF-51]`.

### Task 4: Lista de presentaciones y crear

**Files:**
- Create:
  - `src/features/presentations/shared/usePresentations.ts`;
  - `src/features/presentations/list/PresentationsPage.vue`, `PresentationRow.vue`, `NewPresentationForm.vue`;
  - `tests/browser/features/presentations/list.test.ts`.
- Modify:
  - `src/app/router.ts`: `/presentaciones` → `presentaciones`; `/presentaciones/:id` → `presentacion` (por ahora con una página mínima que Task 5 reemplaza).
  - `src/app/AppHeader.vue`: enlace "Presentaciones".
  - `tests/unit/architecture.test.ts`: se permite importar de `src/features/<x>/shared/`.

**Interfaces:**
- Consumes: `nextSaturday`, `newPresentation`.
- Produces:
  ```ts
  export function usePresentations(): {
    upcoming: Readonly<Ref<Presentation[]>>   // date >= hoy, ascendente
    past: Readonly<Ref<Presentation[]>>       // descendente
    loaded: Readonly<Ref<boolean>>
    openOrCreate(date: string): Promise<string>   // id de la existente o de la nueva (con sugerencias)
    remove(p: Presentation): Promise<void>        // con useConfirm: "¿Eliminar la presentación del sábado 7 de noviembre? Los anuncios no se borran."
  }
  ```
- [ ] **Step 1: pruebas que fallan** (`mountApp('/presentaciones', db)`, con hoy fijo).
  - El formulario trae la fecha del próximo sábado.
  - "Crear presentación" → navega a `presentacion`, y la presentación guardada tiene como items las sugerencias.
  - Volver a crear con la misma fecha → la misma id; `db.presentations.count()` sigue en 1.
  - Las próximas y las pasadas aparecen en secciones separadas, y cada fila muestra la fecha larga y "N anuncios".
  - Eliminar pide confirmación y no borra los anuncios.
  - El encabezado tiene el enlace "Presentaciones".
- [ ] **Step 2:** FAIL → implementar. Las filas usan `formatDate` (P2: "Sábado 7 de noviembre"). La página queda en ≤ 80 líneas.
- [ ] **Step 3:** PASS; arquitectura PASS; commit `feat(presentaciones): lista, crear con anuncios sugeridos y una por fecha [RF-50, RF-52]`.

### Task 5: Armar la presentación

**Files:**
- Create:
  - `src/features/presentations/detail/PresentationPage.vue`, `usePresentationRecord.ts`, `PresentationItems.vue`, `AddAnnouncements.vue`, `FrameOptions.vue`;
  - `tests/browser/features/presentations/detail.test.ts`.

**Interfaces:**
- Consumes: `moveItem`, `contentIssues`, `UiSortableList`, `useSlideContext(date)`.
- Produces:
  ```ts
  export function usePresentationRecord(id: Ref<string>): {
    presentation: Readonly<Ref<Presentation | undefined>>; missing: Readonly<Ref<boolean>>
    byId: Readonly<Ref<ReadonlyMap<string, Announcement>>>   // todos los anuncios (incluye borrados, para "Anuncio eliminado")
    update(patch: Partial<Pick<Presentation, 'items' | 'showCover' | 'showClosing' | 'coverTitle'>>): Promise<void>
    //   guarda al momento (sin botón "Guardar"): cada acción es pequeña y reversible
  }
  ```
- **Pantalla** (layout de laptop: contenido a la izquierda y miniaturas a la derecha, como el editor; en el celular, apiladas):
  - encabezado "Sábado 7 de noviembre";
  - `PresentationItems`: título, fecha del evento, `StatusBadge` (P4) y "Quitar";
  - `AddAnnouncements`: los activos que no están en la presentación, sugeridos primero, con el botón "Agregar";
  - `FrameOptions`: casillas "Portada" (con el campo "Título de la portada" y su placeholder = `settings.coverTitle`) y "Cierre".
  - Si la id no existe: `UiEmptyState` con "Esta presentación ya no existe." y un enlace a la lista.
- [ ] **Step 1: pruebas que fallan.**
  - Bajar el primer anuncio → el orden queda guardado en Dexie.
  - Quitar → el anuncio sale de la presentación y sigue en `announcements`.
  - Agregar un anuncio sin fecha → queda al final.
  - Un id borrado se muestra como "Anuncio eliminado" con el botón "Quitar".
  - Desmarcar "Portada" → `showCover: false`.
  - Escribir el título → `coverTitle` queda guardado.
  - Una id inexistente → el estado vacío.
- [ ] **Step 2:** FAIL → implementar. `PresentationItems` muestra el `StatusBadge` y el `TypeMark` de `announcements/shared`.
- [ ] **Step 3:** PASS; arquitectura PASS; commit `feat(presentaciones): ordenar, agregar, quitar, portada y cierre [RF-51, RF-53]`.

### Task 6: Miniaturas, "Preparar sin internet" e Inicio

**Files:**
- Create:
  - `src/features/presentations/detail/SlideThumbnails.vue`, `SlideThumb.vue`;
  - `src/features/presentations/shared/useOfflineCheck.ts`, `OfflineStatus.vue`, `NextPresentationCard.vue`;
  - `tests/browser/features/presentations/prepare.test.ts`.
- Modify: `PresentationPage.vue`, `src/features/home/HomePage.vue`.

**Interfaces:**
- Consumes: `presentationSlides`, `checkOffline`, `issueMessage`, `browserOfflineEnv`, `SlideView`.
- Produces:
  ```ts
  // SlideThumbnails: props { slides: PresentationSlide[]; ctx: SlideContext }; muestra "N slides";
  //   emite measured: Map<announcementId, 'ok'|'no_cabe'|'midiendo'> (el peor por anuncio)
  export function useOfflineCheck(input: Ref<CheckInput | undefined>, env?: OfflineEnv): {
    report: Readonly<Ref<OfflineReport | undefined>>; checking: Readonly<Ref<boolean>>
    prepare(): Promise<void>   // con persist; vuelve a comprobar
  }
  //   comprueba solo (sin persist) al montar y cuando cambia input
  ```
  - **Miniatura:** contenedor 16:9 con `SlideView`. Si mide `no_cabe`, se marca con un borde de peligro y la etiqueta "No cabe". Al pulsarla se abre el editor del anuncio; la portada y el cierre no son pulsables.
  - **`OfflineStatus`:** "✓ Lista para usar sin internet" (success) o "Falta algo para usar sin internet" con la lista de `issueMessage`. Los problemas de un anuncio enlazan a su editor. Si `!persistent` tras preparar, añade: "El navegador podría borrar los datos si se queda sin espacio."
  - **`NextPresentationCard` en Inicio:** la presentación del próximo sábado, con fecha, "N slides" y `OfflineStatus` compacto (sin persist). Si no existe: botón "Crear la presentación del sábado" (`openOrCreate`).
- [ ] **Step 1: pruebas que fallan** (con un `OfflineEnv` falso inyectado por `provide`).
  - La presentación con portada, 2 anuncios y cierre → 4 miniaturas y el texto "4 slides".
  - Un anuncio que no cabe con la fecha de la presentación → su miniatura dice "No cabe" y el estado dice "«…» no cabe en su slide."
  - Todo bien → pulsar "Preparar sin internet" llama a `requestPersist` y muestra "✓ Lista para usar sin internet".
  - Si `appInstalled` es falso → se muestra el mensaje de `app`.
  - Inicio sin presentación → el botón crea la presentación y navega a ella.
  - Inicio con presentación lista → muestra "✓ Lista".
- [ ] **Step 2:** FAIL → implementar. `browserOfflineEnv` es el valor por defecto de un `inject` con clave propia, que las pruebas reemplazan.
- [ ] **Step 3:** PASS; arquitectura PASS; commit `feat(presentaciones): miniaturas con conteo, preparar sin internet e Inicio [RF-54, RF-55, §6.1]`.

### Task 7: Flujo completo sin red y verificación

**Files:**
- Modify: `tests/e2e/anuncios.spec.ts` (o crear `tests/e2e/presentaciones.spec.ts`), `HANDOFF.md`, hoja de ruta (estado de P5).

- [ ] **Step 1: E2E** contra el build de vista previa, con el Service Worker activo.
  - Crear 2 anuncios con fecha futura y abrir Inicio.
  - "Crear la presentación del sábado": los 2 anuncios quedan sugeridos.
  - Bajar el primero con el botón y comprobar que se ven 4 miniaturas.
  - **Cortar la red** (`context.setOffline(true)`) y recargar.
  - "Preparar sin internet" → "✓ Lista para usar sin internet".
  - En Pixel 7: sin scroll horizontal y zonas táctiles ≥ 44 px.
- [ ] **Step 2: verificación completa.** Todo debe salir verde:
  - `pnpm typecheck` → 0;
  - `pnpm test`;
  - `pnpm build`;
  - `pnpm test:e2e`.
- [ ] **Step 3: revisión a ojo** en claro, oscuro y celular (375 px), en Chrome. Las capturas se quedan en local.
- [ ] **Step 4:** actualizar HANDOFF (estado, estructura `features/presentations/`, próxima tarea: P6) y commit `test(presentaciones): flujo completo sin red [RF-50…RF-55, §10.1]`.
