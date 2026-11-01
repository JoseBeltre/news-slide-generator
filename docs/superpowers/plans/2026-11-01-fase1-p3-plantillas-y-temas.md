# P3 · Plantillas y temas de las slides: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paso 4 de SRS §11: convertir un anuncio (tipo + valores) en una o varias slides de 1920×1080 que cumplen §5 siempre: temas de color con contraste garantizado, plantillas Clásica y Visual para los 6 tipos de texto, cumpleaños en sus tres modos, slide de imagen con relleno difuminado, portada y cierre, todo verificado con datos extremos y capturas.

**Architecture:** Las plantillas son **genéricas sobre los tipos** (RNF-08): leen los `FieldDef` y su `role`, no tienen código por tipo. Un anuncio pasa por `normalizeAnnouncement` (texto ya formateado en es-DO, filas con ícono, densidad §5.4) y el `layout` de la plantilla produce `SlideSpec[]` (casi siempre 1; varios solo en cumpleaños). Un único componente `SlideView` dibuja cualquier `SlideSpec` dentro de `SlideCanvas` y emite su estado ("ok" o "No cabe" con el campo culpable); es el mismo que usarán la vista previa, las miniaturas y la ventana pública (§8.2). El estilo de las slides es **propio y no depende del DESIGN.md de la interfaz** (decisión del responsable).

**Tech Stack:** Lo de P1 y P2 + **`lucide-vue-next`** (íconos SVG empaquetados, ISC). Gestor: **pnpm**.

**Spec:** `SRS.md` v1.3 (§2.4 C-04/C-05/C-07, §3.3 RF-20…26, §3.4 RF-30…33, §3.5 RF-37…39, §3.6 RF-40/41, §5 completo, §7 contrato de plantilla, §8.2, §9, §10 criterios 4, 6, 7, 8, 9 y 13). Hoja de ruta: `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md`. Motor: `src/slides/engine/index.ts` (P1). Tipos y datos: `src/slides/types/`, `src/data/` (P2).

## Global Constraints

- **HANDOFF.md:** leerlo antes de cada tarea si no está en el contexto; actualizarlo al terminarla y añadirlo a su commit.
- **pnpm** para todo. Nunca npm.
- **Offline (C-03):** íconos y fuentes empaquetados; ningún `fetch` ni CSS a otro origen. La E2E de "sin orígenes externos" de P1 sigue pasando.
- **§5 manda sobre el estilo:** ningún texto bajo el mínimo de su rol (`TEXT_ROLES`), todo dentro de `SAFE_AREA`, contraste texto/fondo ≥ 7:1 (`ensureContrast` / `ensureGradientContrast`), logo 90–160 px de alto (portada ≤ 400), íconos de datos ≥ 64 px, interlineado 1.2, nada de cursivas, mayúsculas sostenidas solo en una línea.
- **Nunca texto sobre foto (§5.5):** la foto va en su propio panel; el texto siempre sobre un fondo sólido o degradado verificado.
- **Sin animaciones** en las slides (el fundido ≤ 300 ms entre slides es de P6). Sin capas libres ni efectos (C-05).
- **Determinismo (C-01):** mismos datos + misma plantilla + mismo tema = misma slide. Nada aleatorio en la decoración.
- **Marcado para `auditSlide`:** `data-role`, `data-logo` / `data-cover`, `data-icon`, `data-bg="#hex,…"` en todo contenedor con degradado.
- **Textos en español**; identificadores en inglés.
- **Licencias:** anotar `lucide-vue-next` (ISC) en `LICENSES.md`.
- **Commits:** en español con IDs del SRS y `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Tras unir a `master`, `git push origin master`.

## Review Focus

- **Fecha relativa preparada otro día** (anuncio editado el martes para el sábado 19:00) → al proyectarse ese sábado dice "ESTA NOCHE"; nunca "HOY" calculado con el día de edición. Prueba en Tarea 1.
- **Cumpleaños que cruzan de mes o de año** (30 de diciembre y 2 de enero en la semana del 1 de enero) → orden por cercanía a la fecha de la presentación, no por mes/día: primero el 30 de diciembre. Prueba en Tarea 8.
- **Color personalizado de bajo contraste** (amarillo claro `#fff59d`) → el texto llega a ≥ 7:1 y `deriveTheme` avisa que ajustó el color (criterio §10.9). Prueba en Tarea 3.
- **Todos los opcionales llenos** (salida con 7 filas) → "No cabe" por densidad señalando el último campo opcional lleno, nunca letra más pequeña; **todos vacíos** → slide sin huecos. Pruebas en Tareas 2 y 6.
- **Logo "ninguno"** → el título ocupa el ancho completo; no queda hueco en la esquina (criterio §10.7). Prueba en Tarea 6.
- **Flyer vertical (1080×1920)** → imagen completa, relleno con la misma imagen difuminada, sin barras negras (criterio §10.8). Prueba en Tarea 10.

---

## Estructura de archivos

```
src/slides/icons.ts                     # registro nombre Lucide → componente (solo los usados)
src/slides/normalize.ts                 # anuncio → NormalizedData (texto es-DO, filas, densidad)
src/slides/themes.ts                    # temas predefinidos, tema neutro, deriveTheme, acentos por tipo
src/slides/templates/contract.ts        # TemplateDef, SlideSpec, SlideStatus, SlideContext
src/slides/templates/registry.ts        # TEMPLATES, getTemplate, templatesFor(typeId)
src/slides/templates/SlideView.vue      # dibuja cualquier SlideSpec y emite SlideStatus
src/slides/templates/parts/             # LogoSlot.vue, InfoRows.vue, Decoration.vue, TypeIcon.vue
src/slides/templates/classic/           # layout.ts + ClassicSlide.vue
src/slides/templates/visual/            # layout.ts + VisualSlide.vue
src/slides/templates/birthday/          # layout.ts (reparto) + BirthdaySingle.vue + BirthdayGroup.vue
src/slides/templates/image/             # ImageSlide.vue
src/slides/templates/cover/             # CoverSlide.vue + ClosingSlide.vue
src/slides/useImageUrl.ts               # imageId → object URL (Dexie) con liberación
galeria.html + src/dev/Gallery.vue      # galería de desarrollo (no entra en el build)
tests/fixtures/announcements.ts         # datos normales y extremos por tipo
tests/unit/slides/…  tests/browser/slides/…  tests/e2e/galeria.spec.ts
```

---

### Task 1: Formatos de fecha configurables y fechas relativas

**Files:** Modify `src/lib/format.ts`, `src/data/models.ts`, `tests/unit/lib/format.test.ts`.

Pedido del responsable (cambia §3.2, que solo pedía el formato largo): el formato de la fecha se elige; hay un valor por defecto en Configuración y cada anuncio puede cambiarlo.

**Interfaces:**
- Consumes: `parseLocalDate`, `formatTime` (P2).
- Produces:
  ```ts
  export type DateStyle = 'largo' | 'medio' | 'corto' | 'corto-mes-completo'
  export interface DateFormatOptions {
    style?: DateStyle            // por defecto 'largo'
    relative?: boolean           // por defecto false
    reference: string            // 'YYYY-MM-DD': fecha de la presentación (o hoy si no hay presentación)
    time?: string                // 'HH:mm' del evento, para "ESTA NOCHE"
  }
  export function formatEventDate(iso: string, opts: DateFormatOptions): string
  // models.ts
  Settings += { dateStyle: DateStyle; relativeDates: boolean }      // por defecto 'largo' y false
  Announcement += { dateStyle?: DateStyle; relativeDates?: boolean } // si faltan, se usan los de Settings
  ```
- `formatDate` (P2) queda como está y equivale a `style: 'largo'` sin relativas.

Formatos (evento el sábado 7 de noviembre de 2026; referencia en noviembre de 2026):

| Estilo | Mismo mes que la referencia | Otro mes | Otro año |
|---|---|---|---|
| `largo` | Sábado 7 de noviembre | Sábado 5 de diciembre | Sábado 2 de enero de 2027 |
| `medio` | SÁBADO 7 DE NOV | SÁBADO 5 DE DIC | SÁBADO 2 DE ENE 2027 |
| `corto` | SÁB 7 | SÁB 5 DIC | SÁB 2 ENE 2027 |
| `corto-mes-completo` | SÁB 7 | SÁB 5 DICIEMBRE | SÁB 2 ENERO 2027 |

- Abreviaturas **fijas** (no las de `Intl`, que da "sept" y varía entre motores): días DOM LUN MAR MIÉ JUE VIE SÁB; meses ENE FEB MAR ABR MAY JUN JUL AGO SEP OCT NOV DIC. Las mayúsculas llevan tilde (SÁB, MIÉ).
- **Relativas** (`relative: true`), comparando con `reference`: mismo día con `time` ≥ 18:00 → "ESTA NOCHE"; mismo día → "HOY"; día siguiente → "MAÑANA". En cualquier otro caso, el estilo elegido. Con `largo` van en tipo oración: "Esta noche", "Hoy", "Mañana".
- La referencia es la **fecha de la presentación**, no el día en que se edita: un anuncio preparado el martes para el sábado dice "ESTA NOCHE" cuando se proyecta ese sábado.
- **§5.2:** los estilos en mayúsculas solo se usan en filas de una línea; la fila de fecha (con la hora unida) es `maxLines: 1`. Si no cabe en una línea, la slide queda "No cabe" señalando `fecha`; nunca se parte en dos líneas en mayúsculas. Con estilos en mayúsculas, la hora también va en mayúsculas ("7:00 P. M.").

- [ ] **Step 1: pruebas que fallan** (`format.test.ts`): la tabla completa de arriba (12 casos); relativas con referencia `'2026-11-07'`: `time '19:00'` → "ESTA NOCHE", `'18:00'` → "ESTA NOCHE", `'17:59'` → "HOY", sin `time` → "HOY", evento `'2026-11-08'` → "MAÑANA", evento `'2026-11-06'` (ayer) → el estilo normal, nunca relativa; con `largo` → "Esta noche"; cruce de año: referencia `'2026-12-31'`, evento `'2027-01-01'` → "MAÑANA" y sin relativas `corto` → "VIE 1 ENE 2027"; septiembre `corto` otro mes → "… SEP" (nunca "SEPT").
- [ ] **Step 2:** `pnpm vitest run format` → FAIL.
- [ ] **Step 3:** implementar `formatEventDate` y añadir los campos al modelo (sin cambio de esquema Dexie: no son índices).
- [ ] **Step 4:** `pnpm vitest run format` → PASS; `pnpm typecheck` → 0 errores.
- [ ] **Step 5:** commit `feat(formato): estilos de fecha y fechas relativas [§3.2, pedido del responsable]`.

### Task 2: Íconos y normalización del anuncio

**Files:** Create `src/slides/icons.ts`, `src/slides/normalize.ts`, `tests/fixtures/announcements.ts`, `tests/unit/slides/icons.test.ts`, `tests/unit/slides/normalize.test.ts`. Modify `package.json`, `LICENSES.md`.

**Interfaces:**
- Consumes: `formatEventDate`, `DateStyle` (Task 1); `ANNOUNCEMENT_TYPES`, `getTypeDef`, `FieldDef` (P2); `formatTime`, `formatMoney` (P2); `checkDensity`, `countWords` (P1).
- Produces:
  ```ts
  // icons.ts
  export const ICONS: Readonly<Record<string, Component>>   // claves = nombres Lucide de FieldDef.icon y AnnouncementTypeDef.icon
  export function iconFor(name: string | undefined): Component | undefined
  // normalize.ts
  export interface InfoRow { fieldKeys: string[]; icon?: string; text: string; role: 'key' | 'secondary' }
  export interface NormalizedData {
    typeId: AnnouncementTypeId
    title?: { fieldKey: string; text: string }
    rows: InfoRow[]                       // en el orden de los FieldDef, ya sin vacíos
    imageFieldKey?: string; imageId?: string   // primer campo kind 'image' con valor
    density: { status: 'ok' } | { status: 'no_cabe'; code: 'too_many_lines' | 'too_many_words'; fieldKey: string }
  }
  export function normalizeAnnouncement(typeId: AnnouncementTypeId, values: Record<string, unknown>,
    ctx: { today: string; reference: string; dateStyle?: DateStyle; relativeDates?: boolean; timeFormat?: '12h' | '24h'; currency?: string }): NormalizedData
  ```

- [ ] **Step 1:** `pnpm add lucide-vue-next` (si npm lo marca como obsoleto, usar el paquete Vue oficial que indique, `@lucide/vue`, y anotar la decisión); anotarlo en `LICENSES.md` (ISC).
- [ ] **Step 2: pruebas que fallan** (`icons.test.ts`): cada `icon` de cada `FieldDef` y cada `AnnouncementTypeDef.icon` de `ANNOUNCEMENT_TYPES` existe en `ICONS`; `iconFor('nada')` → `undefined`.
- [ ] **Step 3: pruebas que fallan** (`normalize.test.ts`), con `today: '2026-11-01'`:
  - culto `{titulo:'Semana de oración', fecha:'2026-11-07', hora:'19:00', lugar:'Templo central'}` → `title.text === 'Semana de oración'`; `rows[0]` = `{fieldKeys:['fecha','hora'], icon:'calendar', text:'Sábado 7 de noviembre · 7:00 p. m.', role:'key'}` (fecha y **primera** hora del tipo se unen en una fila); `rows[1].text === 'Templo central'` con ícono `map-pin`.
  - precio 0 → fila "Gratis"; lista `queLlevar ['Agua','Gorra']` → una fila `'Agua, Gorra'` (unión con `', '`, sin cambiar mayúsculas).
  - campos `presenter-only` e `image` nunca son filas; `imageId` toma el primer `image` con valor.
  - campos vacíos u opcionales ausentes no generan filas.
  - salida con todos los opcionales llenos (7 filas) → `density = {status:'no_cabe', code:'too_many_lines', fieldKey:'contacto'}` (el **último** campo con fila).
  - aviso con `mensaje` de 41 palabras → `too_many_words` con `fieldKey:'mensaje'`.
  - con `dateStyle: 'corto'` y `relativeDates: true`, referencia `'2026-11-07'` y hora `'19:00'` → fila `'ESTA NOCHE · 7:00 P. M.'`.
  - tipos `cumpleanos` e `imagen` lanzan `Error` (tienen su propio layout).
- [ ] **Step 4:** correr `pnpm vitest run normalize icons` → FAIL por módulos inexistentes.
- [ ] **Step 5:** implementar. `ICONS` importa por nombre desde `lucide-vue-next` solo los íconos usados (tree-shaking; nada de `import *`). Texto corrido para §5.4 = filas `secondary` de campos `longtext`.
- [ ] **Step 6:** `pnpm vitest run normalize icons` → PASS; `pnpm typecheck` → 0 errores.
- [ ] **Step 7:** commit `feat(slides): normalización de anuncios e íconos locales [§5.4, RNF-08]`.

### Task 3: Temas, tema neutro y color personalizado

**Files:** Create `src/slides/themes.ts`, `tests/unit/slides/themes.test.ts`.

**Interfaces:**
- Consumes: `ensureContrast`, `ensureGradientContrast`, `contrastRatio`, `pickTextColor`, `LOGO_MIN_CONTRAST`, `MIN_CONTRAST` (P1); `Theme` (P2).
- Produces:
  ```ts
  export interface SlidePalette {
    background: string[]          // 1 color (sólido) o 2–3 paradas (degradado); text ≥ 7:1 contra todas
    text: string                  // '#ffffff' o '#000000' (pickTextColor)
    accent: string                // decoración, bandas, chip del ícono; ≥ 3:1 contra el fondo
    onAccent: string              // texto/ícono sobre el acento, ≥ 7:1
    fontFamily: string
  }
  export interface ResolvedTheme { palette: SlidePalette; adjusted: boolean; warning?: string }
  export const NEUTRAL_THEME_ID = 'neutro'
  export const PRESET_THEMES: readonly Theme[]          // 'neutro' + 5 paletas predefinidas
  export const TYPE_ACCENTS: Readonly<Record<AnnouncementTypeId, string>>   // identidad por tipo (§9)
  export function resolveTheme(theme: Theme, typeId?: AnnouncementTypeId): ResolvedTheme
  export function deriveTheme(primary: string): ResolvedTheme
  ```
- Valores fijados: tema neutro = fondo azul oscuro `#0b1f3a` → `#12325e` (degradado suave), texto blanco (RF-33). `deriveTheme('#fff59d')` → `adjusted: true`, `warning: 'Ajustamos el color para que el texto se lea bien en la pantalla.'`.

- [ ] **Step 1: pruebas que fallan:** para **cada** tema de `PRESET_THEMES` × cada `typeId`: `contrastRatio(text, stop) ≥ 7` para todas las paradas, `contrastRatio(onAccent, accent) ≥ 7`, `minContrast(accent, background) ≥ 3`; neutro tal cual arriba; `deriveTheme` con `#fff59d`, `#ffff00`, `#777777`, `#000000`, `#ffffff` → los mismos invariantes, y `adjusted` es `true` solo si se cambió algún color; `deriveTheme('rojo')` lanza `InvalidColorError`; determinismo: dos llamadas iguales → mismo resultado (`toEqual`).
- [ ] **Step 2:** `pnpm vitest run themes` → FAIL.
- [ ] **Step 3:** implementar. El acento del tipo se usa solo en decoración y chip de ícono; si no llega a 3:1 contra el fondo del tema se aclara u oscurece (misma búsqueda de luminosidad que `ensureContrast`, objetivo 3).
- [ ] **Step 4:** `pnpm vitest run themes` → PASS.
- [ ] **Step 5:** commit `feat(temas): temas con contraste garantizado y color personalizado [RF-31, RF-32, RF-33, §5.5]`.

### Task 4: Contrato de plantilla, `SlideView`, logo y galería

**Files:** Create `src/slides/templates/contract.ts`, `registry.ts`, `SlideView.vue`, `parts/LogoSlot.vue`, `parts/TypeIcon.vue`, `src/slides/useImageUrl.ts`, `galeria.html`, `src/dev/Gallery.vue`, `tests/browser/slides/SlideView.test.ts`. Modify `playwright.config.ts`.

**Interfaces:**
- Consumes: `SlideCanvas`, `FitText`, `summarizeFit`, `selectLogoVariant`, `clampLogoHeight` (P1); `logoCandidatesFor`, `logoUrlFor`, `getImageBlob` (P2); Tasks 2–3.
- Produces:
  ```ts
  export interface SlideContext { today: string; presentationDate?: string; ministries: readonly Ministry[]; theme: ResolvedTheme; settings: Pick<Settings,'churchName'|'coverTitle'|'timeFormat'|'currency'|'birthdayDefaultMessage'|'dateStyle'|'relativeDates'> }   // el anuncio puede sobrescribir dateStyle/relativeDates
  export type SlideSpec =
    | { kind: 'announcement'; templateId: 'clasica' | 'visual'; data: NormalizedData; logo: LogoSelection }
    | { kind: 'birthday-single'; person: Person; message?: string; verse?: string; logo: LogoSelection; page?: [number, number] }
    | { kind: 'birthday-group'; people: Person[]; message?: string; logo: LogoSelection; page?: [number, number] }
    | { kind: 'image'; imageId: string }
    | { kind: 'cover' | 'closing' }
  export interface SlideStatus { status: 'ok' | 'no_cabe'; offendingFields: string[]; reason?: 'fit' | 'density' }
  export interface TemplateDef { id: string; name: string; typeIds: AnnouncementTypeId[]; layout: (a: Pick<Announcement,'typeId'|'values'|'logo'>, ctx: SlideContext) => SlideSpec[] }
  export const TEMPLATES: readonly TemplateDef[]; export function templatesFor(typeId): TemplateDef[]
  export function buildSlides(a: Pick<Announcement,'typeId'|'templateId'|'values'|'logo'>, ctx: SlideContext): SlideSpec[]
  // SlideView.vue: props { spec: SlideSpec; ctx: SlideContext }, emits status: [SlideStatus]
  // LogoSlot.vue: props { selection; ministries; background: string[]; box: Rect; cover?: boolean } → nada si no hay candidatos
  ```
- La galería (`galeria.html`) solo existe en `pnpm dev` (Vite construye únicamente `index.html`). Muestra cada fixture × plantilla × tema escalado, con su `SlideStatus` debajo, y acepta `?only=<id>` para mostrar una sola slide a 1920×1080 (para capturas).

- [ ] **Step 1: pruebas que fallan** (`SlideView.test.ts`, browser): un `SlideSpec` de prueba mínimo (`cover`) monta dentro de `SlideCanvas` y emite `{status:'ok'}`; `LogoSlot` con `{kind:'ninguno'}` no deja elemento `[data-logo]`; con `{kind:'iglesia'}` sobre `#0b1f3a` pinta el SVG `iasd-horizontal-blanco` con alto entre 90 y 160; un `buildSlides` con `templateId` desconocido usa el `defaultTemplateId` del tipo.
- [ ] **Step 2:** `pnpm vitest run SlideView` → FAIL.
- [ ] **Step 3:** implementar. `useImageUrl` crea el object URL desde `getImageBlob` y lo revoca al desmontar. `SlideView` junta `summarizeFit` de los `FitText` con `data.density` (densidad gana: `reason:'density'`).
- [ ] **Step 4:** `playwright.config.ts`: segundo `webServer` (`pnpm dev --port 5174 --strictPort`) y proyecto `galeria` con `baseURL` `http://localhost:5174`; la E2E offline existente sigue usando el build en 4173.
- [ ] **Step 5:** `pnpm vitest run SlideView` → PASS; `pnpm build` no incluye `galeria.html` en `dist/`.
- [ ] **Step 6:** commit `feat(plantillas): contrato de plantilla, SlideView y logo automático [§7, §8.2, RF-37, RF-38, RF-39]`.

### Task 5: Dirección visual de las slides (elige el responsable) — **PUNTO DE PARADA**

**Files:** Create `src/slides/templates/parts/Decoration.vue`, `docs/slides-direccion-visual.md`, 3 capturas en `docs/slides-direcciones/`.

Las slides tienen estilo propio, distinto de la interfaz. Siguiendo "mostrar, no describir" (`ecc:frontend-slides`), se construyen **3 direcciones visuales** como variantes del componente `Decoration` (bordes, bandas, forma del chip del ícono, tratamiento del degradado) usando la plantilla Clásica de culto con el tema neutro y con un tema claro. Todas respetan §5; difieren solo en carácter:

1. **Sobria institucional:** fondo sólido o degradado muy suave, una barra fina de acento junto al título, chips de ícono circulares. Máxima calma; se ve bien con cualquier logo.
2. **Banda de color:** franja diagonal o lateral del color del tipo, título sobre el fondo liso al lado, chips cuadrados redondeados. Identidad por tipo más fuerte (§9).
3. **Cálida y festiva contenida:** degradado más visible, formas geométricas suaves en las esquinas fuera de la zona de texto, chips en "píldora". Más cercana para jóvenes y actividades.

- [ ] **Step 1:** implementar `Decoration` con `variant: 'sobria' | 'banda' | 'calida'` y la galería mostrando las 3 sobre culto (tema neutro y claro), cumpleaños individual sin foto y aviso.
- [ ] **Step 2:** capturas 1920×1080 de cada variante en `docs/slides-direcciones/`; `auditSlide` → `[]` en todas.
- [ ] **Step 3:** **parar y presentar al responsable** las 3 direcciones, cada una con su fundamento (legibilidad a distancia, identidad por tipo, sobriedad para el culto). Enviar las capturas.
- [ ] **Step 4:** registrar la elegida en `docs/slides-direccion-visual.md` y en HANDOFF (decisión); dejar solo esa variante como predeterminada (las otras se borran: YAGNI).
- [ ] **Step 5:** commit `feat(slides): dirección visual elegida por el responsable [§9]`.

### Task 6: Plantilla Clásica

**Files:** Create `src/slides/templates/classic/layout.ts`, `ClassicSlide.vue`, `parts/InfoRows.vue`, `tests/browser/slides/classic.test.ts`.

**Interfaces:** `classicLayout(data: NormalizedData, opts: { hasLogo: boolean }) => { title: TextSlotDef; rows: Array<{ row: InfoRow; slot: TextSlotDef; icon: Rect }>; logo?: Rect }`.

Geometría (px del lienzo, todo dentro de `SAFE_AREA`):
- Logo arriba a la derecha: caja `{x:1424, y:64, width:400, height:160}`.
- Título: `{x:96, y:64, width: hasLogo ? 1296 : 1728, height:300}`, rol `title`, `maxLines: 2`.
- Filas: región `{x:96, y:412, width:1728, height:604}` repartida en N filas iguales con 16 px de separación; ícono 64×64 a la izquierda, texto en `x+96`; rol según la fila (`key` → `maxLines:1`, `secondary` → `maxLines:2`).

- [ ] **Step 1: pruebas que fallan** (browser, con fixtures de Task 2) para los 6 tipos de texto: datos normales → `status:'ok'` y `auditSlide(canvas)` → `[]`; título de 120 caracteres → `no_cabe` con `offendingFields:['titulo']`; salida llena → `no_cabe`, `reason:'density'`, `['contacto']`; todos los opcionales vacíos → `ok`, sin filas vacías en el DOM; logo `ninguno` → el título mide 1728 de ancho y no existe `[data-logo]`; mismo anuncio con tema neutro y con `deriveTheme('#fff59d')` → `auditSlide` vacío en ambos.
- [ ] **Step 2:** FAIL. **Step 3:** implementar (`layout.ts` puro, probado también en `tests/unit`: cajas dentro del área segura con `validateTextSlot`). **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(plantillas): Clásica para los 6 tipos [RF-30, §5, §9]`.

### Task 7: Plantilla Visual

**Files:** Create `src/slides/templates/visual/layout.ts`, `VisualSlide.vue`, `tests/browser/slides/visual.test.ts`.

Geometría: panel lateral izquierdo a sangre `{x:0, y:0, width:768, height:1080}` de color de acento con la foto (`object-fit: cover`, apoyada en el borde inferior, §9) o, sin foto, el ícono del tipo grande (≥ 320 px) en `onAccent`. Zona de texto `{x:864, y:64, width:960, height:952}` sobre el fondo del tema: título (`maxLines:3`), filas debajo, logo abajo a la derecha `{x:1424, y:856, width:400, height:160}`.

- [ ] **Step 1: pruebas que fallan:** los mismos casos de Task 6; además culto con `fotoPredicador` → `<img>` dentro del panel y **ningún** `[data-role]` cuyo rectángulo se cruce con el panel (nunca texto sobre foto); sin foto → `[data-icon]` grande en el panel.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(plantillas): Visual con foto o ícono del tipo [RF-30, §5.5, §9]`.

### Task 8: Cumpleaños: reparto en slides

**Files:** Create `src/slides/templates/birthday/layout.ts`, `tests/unit/slides/birthdayLayout.test.ts`.

**Interfaces:** `birthdayLayout(values: { modo: 'individual'|'grupo'|'hibrido'; personas: Person[]; mensaje?: string; versiculo?: string }, ctx: { referenceDate: string }) => SlideSpec[]` (`birthday-single` / `birthday-group`). Capacidad por slide de grupo: **6** si alguien de esa slide tiene foto (3×2), **8** si nadie (2×4) (RF-25).

- [ ] **Step 1: pruebas que fallan:**
  - orden por **cercanía a `referenceDate`** (presentación o, si falta, hoy): referencia `2027-01-01`, personas 2/1, 30/12, 1/1 → orden 30/12, 1/1, 2/1.
  - `individual` con 3 personas → 3 `birthday-single`, sin `page`.
  - `grupo` con 9 sin foto → 2 slides de 8 y 1 con `page` `[1,2]` y `[2,2]`; con 7 y una foto → 6 + 1.
  - `hibrido`: 2 con foto y 3 sin → 2 `birthday-single` + 1 `birthday-group` (3 personas); con todos con foto → solo individuales; con nadie con foto → solo grupo.
  - el mensaje vacío usa `'¡Feliz cumpleaños!'`; nunca aparece año ni edad en la salida.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(cumpleaños): reparto por modo, orden por cercanía y "(1/2)" [RF-21, RF-25, RF-26]`.

### Task 9: Cumpleaños: plantillas individual y grupo

**Files:** Create `BirthdaySingle.vue`, `BirthdayGroup.vue`, `tests/browser/slides/birthday.test.ts`.

- Individual **con foto**: foto a la izquierda (`{x:96, y:64, width:768, height:952}` área, apoyada abajo), nombre `birthdayNameSingle` a la derecha (`maxLines:2`), día ("7 de noviembre", sin año) en `key`, mensaje en `key`, versículo en `secondary`.
- Individual **sin foto**: nombre centrado ocupando el centro (`{x:96, y:240, width:1728, height:480}`, `maxLines:2`), día y mensaje debajo; **sin avatar**.
- Grupo: tarjetas del mismo tamaño en rejilla 3×2 (con fotos) o 2×4 (solo nombres), nombre `birthdayNameGroup` (`maxLines:2`), día en `key`; quien no tiene foto, tarjeta del mismo tamaño con el nombre grande; indicador "(1/2)" en rol `meta`.
- Decoración festiva discreta en los bordes, fuera de las cajas de texto (§9).

- [ ] **Step 1: pruebas que fallan:** individual sin foto no tiene ningún `<img>` ni círculo de avatar y el nombre usa ≥ 160 px con un nombre corto; nombre "Maximiliano-Bartolomé de los Santos Ozuna" → `ok` o `no_cabe` pero **nunca** partido a mitad de palabra; grupo mezclado (3 con foto, 3 sin) → 6 tarjetas del mismo tamaño; slide `[1,2]` muestra "(1/2)"; `auditSlide` vacío en todos los casos `ok`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(cumpleaños): plantillas individual y grupo [RF-22, RF-23, RF-24, §9]`.

### Task 10: Slide de imagen

**Files:** Create `src/slides/templates/image/ImageSlide.vue`, `tests/browser/slides/image.test.ts`.

- Imagen con `object-fit: contain` a lienzo completo; detrás, la **misma imagen** con `object-fit: cover`, `filter: blur(48px) brightness(0.55)` y escalada 1.1 para que el difuminado no deje bordes; sin logo ni texto (RF-40/41).

- [ ] **Step 1: pruebas que fallan:** con un PNG 1080×1920 generado en la prueba → la imagen nítida mide 607.5×1080 centrada y el fondo cubre todo el lienzo (ningún píxel negro puro en las esquinas: muestrear con canvas de la captura del elemento o comprobar estilos computados); con 1920×1080 → sin relleno visible; ningún `[data-logo]`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(plantillas): slide de imagen con relleno difuminado [RF-40, RF-41]`.

### Task 11: Portada y cierre

**Files:** Create `CoverSlide.vue`, `ClosingSlide.vue`, `tests/browser/slides/cover.test.ts`.

- Portada: logo de la iglesia grande (`data-cover`, alto ≤ 400, variante según fondo), `settings.coverTitle` en rol `title` y la fecha de la presentación en `key`. Cierre: logo grande y `settings.churchName` en `title` con "¡Feliz sábado!" en `key`.
- Valores por defecto mientras no existan en Configuración (P4): `coverTitle: 'Anuncios'`, `churchName: 'Mansedumbre II'`.

- [ ] **Step 1: pruebas que fallan:** portada sobre tema neutro → logo blanco con alto 400; `auditSlide` vacío (la regla de logo admite 400 con `data-cover`); cierre igual; título largo de iglesia → `ok` en 2 líneas.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(plantillas): portada y cierre con el logo de la iglesia [RF-39, §9]`.

### Task 12: Pruebas de legibilidad §5.7 completas y capturas

**Files:** Create `tests/browser/slides/matrix.test.ts`, `tests/e2e/galeria.spec.ts`, capturas base en `tests/e2e/galeria.spec.ts-snapshots/`.

- [ ] **Step 1:** `matrix.test.ts` recorre **cada tipo × cada plantilla × {tema neutro, tema claro, `deriveTheme('#fff59d')`} × {normal, todos los opcionales llenos, todos vacíos, título larguísimo, sin logo, fecha en estilo `medio` con hora}** (más cumpleaños en los 3 modos e imagen horizontal y vertical) y comprueba: (a) ningún texto bajo el mínimo, (b) nada fuera del área segura, (c) contraste ≥ 7:1, (d) los que no caben salen `no_cabe` con su campo. Esto es `auditSlide(canvas) → []` cuando el estado es `ok`.
- [ ] **Step 2:** `galeria.spec.ts`: `toHaveScreenshot` de una slide por plantilla y modo (≈ 14 capturas) a 1920×1080 con la galería en `?only=`; crear las capturas base con `--update-snapshots` y revisarlas a ojo antes de guardarlas.
- [ ] **Step 3:** verificación completa: `pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` → todo verde; la E2E offline sigue sin orígenes externos.
- [ ] **Step 4:** actualizar HANDOFF (API de plantillas, P3 hecho, próximo = plan P4 con la elección del DESIGN.md de la interfaz) y la hoja de ruta.
- [ ] **Step 5:** commit `test(plantillas): matriz de legibilidad §5.7 y capturas de regresión [§5.7, §10.13]`.
