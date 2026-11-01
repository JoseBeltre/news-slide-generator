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

### Ajuste del plan tras el rediseño (2026-11-01, después de T5)

T5 cambió la base de las tareas que siguen: ya no hay una sola Clásica con filas e íconos, sino **3 estilos** (Himnario, Almanaque, Cartel) elegidos por `spec.slideStyle`, con la fecha como protagonista, grupos de 1–3 logos y los mínimos de SRS v1.4 (título 84, clave 60, secundario 44, cumpleaños 108/54, meta 32; íconos opcionales ≥ 56 px; interlineado por rol). Las tareas 6–12 quedan así:

- **Reparto entre sesiones** (los dos trabajan en la misma carpeta, sin worktree): T8 y T9 (cumpleaños) las hace la sesión del rediseño, en `src/slides/templates/birthday/` y en el mismo lenguaje visual. Esta sesión hace T6, T7, T10, T11 y T12. Los archivos compartidos (`SlideView.vue`, `registry.ts`, `gallery-entries.ts`) solo se tocan en cambios pequeños y con commit enseguida; cumpleaños añade sus entradas al registrar sus componentes.
- **Global Constraints, valores que cambian:** íconos `@lucide/vue` (no `lucide-vue-next`); íconos de datos **opcionales**, ≥ 56 px si se dibujan; interlineado por rol (1.05 títulos y nombres, 1.1 secundario, 1.2 el resto); spec `SRS.md` **v1.4**.
- **Review Focus, línea que cambia:** "Logo ninguno" → en los 3 estilos el hueco del logo lo ocupa el emblema del tipo (`TypeEmblem`); nunca queda la cabecera vacía.

### Task 6: Clásica en los 3 estilos (pruebas)

El código ya existe (T5: `classic/layout.ts`, `HimnarioSlide`, `AlmanaqueSlide`, `CartelSlide`). Esta tarea lo cubre con pruebas y corrige lo que encuentren.

**Files:** Create `tests/unit/slides/classicLayout.test.ts`, `tests/browser/slides/classic.test.ts`, `tests/browser/helpers/slides.ts` (montar una `SlideSpec` en `SlideView`, esperar fuentes y logos, devolver el último `SlideStatus` y el lienzo; lo reusan T7, T10–T12). Modify lo que las pruebas obliguen.

**Interfaces:**
- Produces (helper): `renderSlide(spec: SlideSpec, ctx: SlideContext): Promise<{ status: SlideStatus; canvas: HTMLElement; host: HTMLElement }>` — espera a que todos los `SlideText` hayan informado y todas las `<img>` estén `complete`.

- [ ] **Step 1: pruebas unitarias que fallan o fijan** (`classicLayout.test.ts`): `stackRows` con 1–6 filas de los fixtures → todas las cajas dentro de `SAFE_AREA` y `validateTextSlot` sin error; la pila no se solapa (cada fila empieza ≥ `ROW_GAP` después de la anterior); `rowLines` de una descripción corta → 1; `titleSlot` con caja de 300 px → `maxLines` 3; `detailRows` quita la fila de la fecha.
- [ ] **Step 2: pruebas de navegador** (`classic.test.ts`), para **cada estilo**:
  - los 5 tipos de texto con `NORMAL` → `ok` y `auditSlide` `[]`;
  - `MINIMAL` → `ok`, sin `SlideText` vacíos;
  - título de 95 caracteres (`longTitle`) → `no_cabe` con `['titulo']`, `reason: 'fit'`;
  - salida `FULL` (7 filas) → `no_cabe`, `reason: 'density'`, `['contacto']`;
  - logo `ninguno` → ningún `[data-logo]` y existe el emblema del tipo (`[data-emblem]`, añadir el atributo a `TypeEmblem`);
  - culto `NORMAL` con tema `cielo` y con `deriveTheme('#fff59d')` (vía `customPrimaryColor`) → `auditSlide` `[]`.
- [ ] **Step 3:** `pnpm vitest run classic` → leer resultados; arreglar las fallas reales en el código (no en la prueba), cada una con su `Ruling:` si cambia geometría.
- [ ] **Step 4:** `pnpm vitest run classic` → PASS; `pnpm typecheck` → 0.
- [ ] **Step 5:** commit `test(plantillas): Clásica en los 3 estilos [RF-30, §5, §9]`.

### Task 7: Visual = Clásica con la foto

Solo **culto** tiene un campo de imagen (`fotoPredicador`, PNG sin fondo). La Visual no es un cuarto diseño: es el **mismo estilo** con la foto recortada de pie sobre el borde inferior y la columna de texto más estrecha. Sin foto, la Visual se dibuja igual que la Clásica.

**Files:** Create `src/slides/templates/parts/PhotoCutout.vue`, `tests/browser/slides/visual.test.ts`. Modify `SlideView.vue` (`visual: ClassicSlide`), `classic/*Slide.vue` (columna estrecha + foto cuando `spec.templateId === 'visual' && spec.data.imageId`), `registry.ts` y `types/definitions.ts` (Visual solo para tipos con un campo `image`), `tests/unit/types/definitions.test.ts`, `src/dev/gallery-entries.ts`, `tests/fixtures/` (una foto recortada de prueba generada en código, sin archivos binarios).

**Interfaces:**
- Produces: `PhotoCutout.vue` props `{ imageId: string; box: Rect; loadImage }` → `<img data-photo>` con `object-fit: contain; object-position: bottom`, apoyada abajo; nada si la imagen no carga.
- `templatesFor(typeId)` y `getTypeDef(typeId).templateIds` coinciden; `visual` solo en tipos con un `FieldDef` `kind: 'image'` (hoy: culto).

- [ ] **Step 1: pruebas que fallan** (`visual.test.ts`), para cada estilo: culto con foto → existe `[data-photo]`, `ok`, `auditSlide` `[]`, y **ningún** `[data-role]` se cruza con el rectángulo de la foto (§5.5); culto Visual sin foto → mismo DOM de texto que la Clásica (mismos `data-role` y textos); `templatesFor('aviso')` no incluye `visual`; `templatesFor('culto')` sí.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. Geometría por estilo (px del lienzo): la foto ocupa una franja fija que llega al borde inferior; el texto se reacomoda en lo que queda. Las cifras exactas se eligen viendo las capturas; cada una queda en el componente como constante.
- [ ] **Step 4:** PASS; capturas de los 3 estilos con foto (`scripts/capturar-galeria.mjs`) en `docs/slides-direcciones/visual/`; **enviarlas al responsable** para su visto bueno (no bloquea T10–T11; si pide cambios, se hacen antes de T12).
- [ ] **Step 5:** commit `feat(plantillas): Visual con la foto del predicador en los 3 estilos [RF-30, §5.5, §9]`.

### Task 8 y Task 9: Cumpleaños → **sesión del rediseño**

Sin cambios de contenido respecto a lo escrito arriba, salvo los mínimos v1.4 (nombre individual 108, grupo 54) y que van en el lenguaje de los 3 estilos. Esta sesión no toca `src/slides/templates/birthday/`.

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

**Files:** Create `src/slides/templates/image/ImageSlide.vue`, `tests/browser/slides/image.test.ts`. Modify `SlideView.vue` (`image: ImageSlide`), `gallery-entries.ts`.

- Imagen con `object-fit: contain` a lienzo completo; detrás, la **misma imagen** con `object-fit: cover`, `filter: blur(48px) brightness(0.55)` y escala 1.1; sin logo ni texto (RF-40/41). Mientras carga o si no hay blob: fondo `#000` y estado `ok` (no hay texto que medir).

- [ ] **Step 1: pruebas que fallan:** PNG 1080×1920 generado con `OffscreenCanvas` → la imagen nítida mide 607.5×1080 centrada (x = 656.25) y la de fondo cubre el lienzo (`getBoundingClientRect` ≥ 1920×1080); PNG 1920×1080 → la nítida mide 1920×1080; ningún `[data-logo]` ni `[data-role]`; `status` `ok`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar con `useImageUrl`. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(plantillas): slide de imagen con relleno difuminado [RF-40, RF-41]`.

### Task 11: Cierre

La portada ya existe en los 3 estilos (T4/T5). El cierre usa **la misma composición** que la portada de su estilo, con `"¡Feliz sábado!"` en lugar de `settings.coverTitle` (la fecha y el nombre de la iglesia se quedan: abre y cierra igual).

**Files:** Modify `cover/Cover*.vue` (texto del título según `spec.kind`), `SlideView.vue` (`closing: CoverSlide`), `registry.ts` (`frameSlide(kind: 'cover' | 'closing', ctx): SlideSpec` con la paleta del tema y `ctx.settings.slideStyle`), `gallery-entries.ts`. Create `tests/browser/slides/cover.test.ts`.

- [ ] **Step 1: pruebas que fallan**, para cada estilo: portada y cierre sobre `neutro` y `cielo` → `ok`, `auditSlide` `[]`, `[data-cover]` presente con alto ≤ 400; cierre contiene "¡Feliz sábado!" y no `coverTitle`; `churchName` de 40 caracteres → `ok`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(plantillas): cierre en los 3 estilos [RF-39, §9]`.

### Task 12: Matriz §5.7 y capturas de regresión

**Files:** Create `tests/browser/slides/matrix.test.ts`, `tests/e2e/galeria.spec.ts`. Modify `playwright.config.ts`, `.gitignore`, `HANDOFF.md`, hoja de ruta.

- [ ] **Step 1:** `matrix.test.ts` (usa `renderSlide`): (a) cada estilo × cada tipo de texto × {normal, lleno, mínimo, título largo, sin logo, fecha `medio` con relativas} en `neutro`; (b) cada estilo × cada tipo `NORMAL` en `cielo` y `deriveTheme('#fff59d')`; (c) Visual con foto × estilo × 3 temas; (d) portada y cierre × estilo × 3 temas; (e) imagen horizontal y vertical. Cada caso: si `ok` → `auditSlide` `[]`; si `no_cabe` → su `offendingFields` no está vacío y el caso es uno de los esperados (título largo, salida llena). Los cumpleaños los añade su sesión a esta matriz.
- [ ] **Step 2:** `galeria.spec.ts`: `toHaveScreenshot` con `?only=` de: por estilo, culto normal, salida llena, aviso, Visual con foto, portada y cierre; más imagen vertical (≈ 19). Las capturas base **no se suben** (decisión del responsable: capturas solo en local): `tests/e2e/galeria.spec.ts-snapshots/` en `.gitignore` y `updateSnapshots: 'missing'` en el proyecto `galeria`, así la primera corrida las crea y las siguientes comparan.
- [ ] **Step 3:** verificación completa: `pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` → todo verde.
- [ ] **Step 4:** HANDOFF (API de plantillas, P3 hecho salvo cumpleaños si aún falta, próximo = revisión final y P4) y hoja de ruta.
- [ ] **Step 5:** commit `test(plantillas): matriz de legibilidad §5.7 y capturas de regresión [§5.7, §10.13]`.
