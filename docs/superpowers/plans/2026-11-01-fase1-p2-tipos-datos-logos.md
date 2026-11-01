# P2 · Tipos de anuncio, datos locales y logos: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paso 3 de SRS §11: definir de forma declarativa los 7 tipos de anuncio del MVP con su validación en español, el formato es-DO de fechas, horas y precios, el almacenamiento local en Dexie (con imágenes comprimidas y sin duplicados) y la biblioteca de ministerios con el logo oficial de la iglesia precargado.

**Architecture:** Los tipos son datos (`AnnouncementTypeDef` + `FieldDef`), no código por tipo (RNF-08); un único generador de esquemas Zod los valida. Dexie es la fuente de verdad local (§8.4) con borrado lógico y `updatedAt` en todo, listo para la sincronización del paso 8, pero **sin** outbox ni red ahora. Los logos precargados viven en `src/assets/logos/` y se convierten en `LogoCandidate` del motor de P1.

**Tech Stack:** Lo de P1 + **Zod** (validación), **Dexie** (ya instalado), `fake-indexeddb` (pruebas en Node), Canvas/`OffscreenCanvas` y `crypto.subtle` del navegador (compresión y hash). Gestor: **pnpm**.

**Spec:** `SRS.md` v1.3 (§3.2, §3.5, §3.13 RF-100, §4 RNF-04/08/10, §7, §8.4). Hoja de ruta: `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md`. Motor: `src/slides/engine/index.ts` (P1).

## Global Constraints

- **HANDOFF.md:** leerlo antes de cada tarea si no está en el contexto; actualizarlo al terminarla y añadirlo a su commit.
- **pnpm** para todo (`pnpm add`, `pnpm test`…). Nunca npm.
- **Offline (C-03):** nada de red. Ningún módulo de P2 hace `fetch` a otro origen.
- **Determinismo (RNF-05):** las funciones de formato y validación reciben "hoy" y el reloj como parámetro cuando dependen de ellos.
- **Fechas:** se guardan como `'YYYY-MM-DD'` y horas como `'HH:mm'`; **siempre** se interpretan en hora local (nunca `new Date('YYYY-MM-DD')`, que es UTC y en RD resta un día).
- **Formato (§3.2):** fecha "Sábado 7 de noviembre" (año solo si no es el actual: "Sábado 7 de noviembre de 2027"); hora 12 h "7:00 p. m." (el espacio entre `p.` y `m.` es U+00A0, tal como lo da `Intl` en Node y Chromium); precio "RD$500", "RD$1,500.50" (sin decimales si son ,00).
- **Textos de interfaz y errores en español** (RF-04). Claves de campos en español sin tildes (`fecha`, `puntoEncuentro`), identificadores de código en inglés.
- **Privacidad (§3.3):** los cumpleaños no piden ni guardan año de nacimiento ni edad.
- **Imágenes (RNF-04):** lado mayor ≤ 2560 px (fotos de personas ≤ 1600 px), WebP calidad 0.82; nunca se agrandan. SVG se guarda tal cual. Ruta de almacenamiento basada en el SHA-256 (§8.4).
- **Licencias:** anotar Zod (MIT) en `LICENSES.md`; `fake-indexeddb` es solo de desarrollo.
- **Commits:** en español con IDs del SRS y `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Fecha `'2026-11-07'` interpretada como UTC** → en RD (UTC−4) se mostraría "Viernes 6". Debe salir "Sábado 7 de noviembre". Pruebas en Tarea 1 con la zona horaria fijada a `America/Santo_Domingo`.
- **Cumpleaños con día inexistente** (31 de abril, 30 de febrero) → error "Ese día no existe en ese mes"; el 29 de febrero es válido (no hay año). Prueba en Tarea 3.
- **La misma imagen subida dos veces** → un solo registro (mismo hash); un archivo que no es imagen → error en español y nada guardado. Pruebas en Tarea 5.
- **Anuncio con logo de un ministerio borrado** → sin candidatos (la slide no deja hueco ni falla). Prueba en Tarea 7.
- **Medianoche y mediodía** (`'00:00'`, `'12:00'`) → "12:00 a. m." y "12:00 p. m.". Prueba en Tarea 1.

---

## Estructura de archivos

```
src/lib/format.ts                 # fecha, hora y precio es-DO
src/lib/dominantColor.ts          # color dominante (puro) + versión para Blob
src/slides/types/
  fields.ts                       # FieldKind, FieldDef, AnnouncementTypeDef
  definitions.ts                  # los 7 tipos del MVP + registro
  validation.ts                   # Zod a partir de FieldDef
src/data/local/
  db.ts                           # Dexie: esquema v1
  repository.ts                   # repositorio genérico con SyncMeta y borrado lógico
  images.ts                       # guardar imagen: comprimir, medir, hash, deduplicar
src/data/ministries.ts            # Ministry, logos precargados, candidatos para el motor
src/assets/logos/iglesia/prueba-{color,blanco,negro}.svg
tests/unit/lib/  tests/unit/types/  tests/unit/data/  tests/browser/data/
```

---

### Task 1: Formato es-DO de fecha, hora y precio

**Files:**
- Create: `src/lib/format.ts`
- Modify: `vitest.config.ts` (zona horaria fija), `HANDOFF.md`
- Test: `tests/unit/lib/format.test.ts`

**Interfaces:**
- Produces:
  - `parseLocalDate(iso: string): Date` — `'YYYY-MM-DD'` → medianoche **local**; lanza `RangeError` si el formato o la fecha no son válidos (`'2026-02-30'`).
  - `formatDate(iso: string, opts?: { today?: Date }): string` — `today` por defecto `new Date()`.
  - `formatTime(hhmm: string, opts?: { timeFormat?: '12h' | '24h' }): string` — por defecto `'12h'`; `'24h'` devuelve `'19:00'`.
  - `formatMoney(amount: number, opts?: { currency?: string }): string` — por defecto `'DOP'`; `0` → `'Gratis'`.

Implementación: `Intl.DateTimeFormat('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year?: 'numeric' })`, primera letra en mayúscula y sin la coma tras el día de la semana. Hora con `Intl.DateTimeFormat('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true })` sobre una fecha local con esa hora. Precio con `Intl.NumberFormat('es-DO', { style: 'currency', currency, minimumFractionDigits: entero ? 0 : 2, maximumFractionDigits: 2 })`.

- [ ] **Step 1: Fijar la zona horaria de las pruebas.** En `vitest.config.ts`: proyecto `unit` con `env: { TZ: 'America/Santo_Domingo' }`; proyecto `browser` con `provider: playwright({ contextOptions: { timezoneId: 'America/Santo_Domingo', locale: 'es-DO' } })` (ajustar a la API instalada si difiere y anotarlo en HANDOFF).

- [ ] **Step 2: Escribir las pruebas que fallan**

```ts
const HOY = new Date(2026, 10, 1) // 1 de noviembre de 2026
it('fecha larga sin año en el año actual (no se corre un día por UTC)', () => {
  expect(formatDate('2026-11-07', { today: HOY })).toBe('Sábado 7 de noviembre')
  expect(formatDate('2026-12-31', { today: HOY })).toBe('Jueves 31 de diciembre')
})
it('agrega el año si no es el actual', () => {
  expect(formatDate('2027-01-02', { today: HOY })).toBe('Sábado 2 de enero de 2027')
})
it('parseLocalDate', () => {
  const d = parseLocalDate('2026-11-07')
  expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 10, 7, 0])
  for (const malo of ['2026-02-30', '2026-13-01', '07/11/2026', '']) expect(() => parseLocalDate(malo)).toThrow(RangeError)
})
it.each([
  ['19:00', '7:00 p. m.'], ['07:30', '7:30 a. m.'],
  ['00:00', '12:00 a. m.'], ['12:00', '12:00 p. m.'],
])('formatTime(%s) → %s', (h, esperado) => { expect(formatTime(h)).toBe(esperado) })
it('formato 24 h', () => { expect(formatTime('19:05', { timeFormat: '24h' })).toBe('19:05') })
it('formatTime rechaza horas inválidas', () => {
  for (const malo of ['24:00', '7:00', '19:60', '']) expect(() => formatTime(malo)).toThrow(RangeError)
})
it.each([[500, 'RD$500'], [1500, 'RD$1,500'], [1500.5, 'RD$1,500.50'], [0, 'Gratis']])(
  'formatMoney(%d) → %s', (n, esperado) => { expect(formatMoney(n)).toBe(esperado) })
```

- [ ] **Step 3: Ejecutar para verlas fallar** — `pnpm test:unit -- format` · FAIL (módulo inexistente).
- [ ] **Step 4: Implementar `src/lib/format.ts`.**
- [ ] **Step 5: Ejecutar** — `pnpm test` · PASS (incluidas las 136 de P1).
- [ ] **Step 6: Actualizar HANDOFF.md y hacer commit** — `feat: formato es-DO de fecha, hora y precio [§3.2]`

---

### Task 2: Definiciones declarativas de los tipos

**Files:**
- Create: `src/slides/types/fields.ts`, `src/slides/types/definitions.ts`
- Test: `tests/unit/types/definitions.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Produces (`fields.ts`), según §7 con dos añadidos (anotar como decisión en HANDOFF):

```ts
export type FieldKind = 'text' | 'longtext' | 'date' | 'time' | 'money' | 'image' | 'people' | 'list' | 'choice'
export type FieldRole = 'title' | 'key' | 'secondary' | 'presenter-only'
export interface FieldDef {
  key: string
  label: string
  kind: FieldKind
  required: boolean
  role?: FieldRole
  icon?: string               // nombre de ícono Lucide (se renderiza en P3)
  maxLength?: number          // orientativo: contador visible, no se impone (§5.6)
  options?: { value: string; label: string }[]  // solo kind 'choice'
  defaultValue?: unknown
}
export interface AnnouncementTypeDef {
  id: AnnouncementTypeId
  name: string
  icon: string
  fields: FieldDef[]
  templateIds: string[]
  defaultTemplateId: string
}
export type AnnouncementTypeId = 'culto' | 'salida' | 'obra_misionera' | 'cumpleanos' | 'actividad' | 'aviso' | 'imagen'
```

  Añadidos sobre §7: `kind: 'choice'` (+ `options`) para el modo de cumpleaños y `defaultValue`. El kind `'ministry'` de §7 no se usa: el logo es `Announcement.logo` (RF-09), no un campo.
- Produces (`definitions.ts`): `ANNOUNCEMENT_TYPES: readonly AnnouncementTypeDef[]` (en el orden de la tabla) y `getTypeDef(id: string): AnnouncementTypeDef` (lanza `Error` si no existe).

**Campos** (clave · etiqueta · kind · rol · ícono · maxLength; `*` = obligatorio):

| Tipo (`id`, nombre, ícono) | Campos |
|---|---|
| `culto`, "Culto / Servicio especial", `church` | `titulo`* "Título" text title — 60 · `fecha`* "Fecha" date key `calendar` · `hora`* "Hora" time key `clock` · `predicador` "Predicador/a" text key `user` 40 · `fotoPredicador` "Foto del predicador (PNG sin fondo)" image · `lugar` "Lugar" text key `map-pin` 50 · `lema` "Tema o lema" text secondary `quote` 80 · `versiculo` "Versículo" longtext secondary `book-open` 140 |
| `salida`, "Salida / Excursión", `bus` | `titulo`* · `fecha`* · `horaSalida`* "Hora de salida" time key `clock` · `destino` "Destino" text key `map-pin` 50 · `puntoEncuentro` "Punto de encuentro" text key `flag` 50 · `precio` "Precio" money key `banknote` · `queLlevar` "Qué llevar" list secondary `backpack` 80 · `fechaLimite` "Fecha límite de pago o inscripción" date secondary `calendar-clock` · `contacto` "Contacto" text secondary `phone` 40 |
| `obra_misionera`, "Obra misionera / Evangelismo", `megaphone` | `titulo`* · `fecha`* · `hora`* · `puntoEncuentro` · `zona` "Zona o sector" text key `map` 50 · `queLlevar` · `contacto` |
| `cumpleanos`, "Cumpleaños", `cake` | `modo`* "Modo de presentación" choice (`individual` "Uno por slide", `grupo` "Varios en una slide", `hibrido` "Híbrido"; `defaultValue: 'individual'`) · `personas`* "Personas" people · `mensaje` "Mensaje" text secondary — 60, `defaultValue: '¡Feliz cumpleaños!'` · `versiculo` |
| `actividad`, "Actividad general", `calendar-days` | `titulo`* · `fecha`* · `hora` · `lugar` · `descripcion` "Descripción corta" longtext secondary — 120 · `precio` · `contacto` |
| `aviso`, "Aviso breve", `message-square` | `titulo`* · `mensaje`* "Mensaje" longtext secondary — 160 · `fecha` · `contacto` |
| `imagen`, "Slide de imagen", `image` | `imagen`* "Imagen" image · `tituloInterno` "Título interno (no se proyecta)" text presenter-only — 60 |

Los campos repetidos (`titulo`, `fecha`, `hora`, `lugar`, `contacto`, `precio`, `queLlevar`, `puntoEncuentro`, `versiculo`) se definen una vez como constantes y se reutilizan. Plantillas: todos los tipos `['clasica', 'visual']` con `defaultTemplateId: 'clasica'` (RF-30); `imagen` → `['imagen']` (un flyer no se diseña, RF-40).

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
const obligatorios = (id: string) => getTypeDef(id).fields.filter(f => f.required).map(f => f.key)
it('los 7 tipos del MVP, en orden', () => {
  expect(ANNOUNCEMENT_TYPES.map(t => t.id)).toEqual(['culto', 'salida', 'obra_misionera', 'cumpleanos', 'actividad', 'aviso', 'imagen'])
})
it.each([
  ['culto', ['titulo', 'fecha', 'hora']], ['salida', ['titulo', 'fecha', 'horaSalida']],
  ['obra_misionera', ['titulo', 'fecha', 'hora']], ['cumpleanos', ['modo', 'personas']],
  ['actividad', ['titulo', 'fecha']], ['aviso', ['titulo', 'mensaje']], ['imagen', ['imagen']],
])('obligatorios de %s según §3.2', (id, claves) => { expect(obligatorios(id)).toEqual(claves) })
it('claves únicas por tipo y etiquetas en español no vacías', () => { /* Set(keys).size === fields.length; label.trim() !== '' */ })
it('cada tipo (salvo imagen) tiene Clásica y Visual', () => { /* templateIds contiene 'clasica' y 'visual'; defaultTemplateId ∈ templateIds */ })
it('choice tiene opciones y su defaultValue es una de ellas', () => { /* modo: defaultValue 'individual' ∈ options */ })
it('cumpleaños no pide año ni edad', () => { /* ninguna clave ni etiqueta contiene /año|edad|nacimiento/i */ })
it('getTypeDef de un tipo desconocido lanza', () => { expect(() => getTypeDef('recaudacion')).toThrow() })
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `pnpm test:unit -- definitions` · FAIL.
- [ ] **Step 3: Implementar** `fields.ts` y `definitions.ts` con la tabla de arriba.
- [ ] **Step 4: Ejecutar** — `pnpm test:unit -- definitions` · PASS.
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(tipos): definiciones declarativas de los 7 tipos del MVP [RF-01, §3.2, RNF-08]`

---

### Task 3: Validación de valores con Zod

**Files:**
- Create: `src/slides/types/validation.ts`
- Modify: `package.json` (`pnpm add zod`), `LICENSES.md`, `HANDOFF.md`
- Test: `tests/unit/types/validation.test.ts`

**Interfaces:**
- Consumes: `FieldDef`, `AnnouncementTypeDef`, `getTypeDef` (Tarea 2); `parseLocalDate` (Tarea 1).
- Produces:
  - `type Person = { name: string; day: number; month: number; photoId?: string }`
  - `buildValuesSchema(typeDef: AnnouncementTypeDef): z.ZodType<Record<string, unknown>>`
  - `validateValues(typeDef: AnnouncementTypeDef, values: Record<string, unknown>): { ok: true; values: Record<string, unknown> } | { ok: false; errors: Record<string, string> }` — `errors` por ruta (`'titulo'`, `'personas.0.name'`), un mensaje por ruta (el primero).
  - `MESSAGES` con los textos exactos de abajo.

**Reglas por kind** (texto se recorta; un opcional vacío se normaliza a ausente y desaparece de `values`). Un campo **obligatorio ausente o vacío** de cualquier kind da siempre `Este campo es obligatorio.` (salvo `people` y `list`, que tienen su propio mensaje); los mensajes de la tabla son para valores presentes pero mal formados:

| kind | Regla | Mensaje |
|---|---|---|
| text, longtext | string; obligatorio → no vacío tras recortar | `Este campo es obligatorio.` |
| date | `parseLocalDate` no lanza | `La fecha no es válida.` |
| time | `/^([01]\d|2[0-3]):[0-5]\d$/` | `La hora no es válida.` |
| money | número finito ≥ 0 | `El precio no puede ser negativo.` |
| image | id string no vacío | `Este campo es obligatorio.` |
| list | array de strings; se recortan y se quitan vacíos; obligatorio → ≥ 1 | `Agrega al menos un elemento.` |
| choice | uno de `options[].value`; si falta, `defaultValue` | `Elige una opción.` |
| people | array ≥ 1 (`Agrega al menos una persona.`); `name` no vacío (`Escribe el nombre.`); `day` entero 1–31, `month` entero 1–12 (`El día o el mes no es válido.`); día existente en el mes, con 29 de febrero válido (`Ese día no existe en ese mes.`); `photoId` opcional | ver celda |

`maxLength` **no** se impone (es orientativo, §5.6). Claves desconocidas se descartan.

- [ ] **Step 1: Instalar** — `pnpm add zod`; anotar en `LICENSES.md`.
- [ ] **Step 2: Escribir las pruebas que fallan**

```ts
const culto = getTypeDef('culto'), cumple = getTypeDef('cumpleanos'), salida = getTypeDef('salida')
it('culto mínimo válido; recorta y quita opcionales vacíos', () => {
  expect(validateValues(culto, { titulo: '  Culto joven ', fecha: '2026-11-07', hora: '19:00', lugar: '  ' }))
    .toEqual({ ok: true, values: { titulo: 'Culto joven', fecha: '2026-11-07', hora: '19:00' } })
})
it('faltan obligatorios → mensajes por campo', () => {
  expect(validateValues(culto, {})).toEqual({ ok: false, errors: {
    titulo: 'Este campo es obligatorio.', fecha: 'Este campo es obligatorio.', hora: 'Este campo es obligatorio.' } })
})
it('fecha y hora inválidas', () => { /* fecha '2026-02-30' y hora '25:00' → sus mensajes */ })
it('precio negativo', () => { /* salida con precio: -1 → errors.precio === 'El precio no puede ser negativo.' */ })
it('qué llevar: recorta y quita vacíos', () => { /* queLlevar: [' Biblia ', '', 'Agua'] → ['Biblia', 'Agua'] */ })
it('cumpleaños: modo por defecto individual', () => {
  const r = validateValues(cumple, { personas: [{ name: 'Ana', day: 3, month: 11 }] })
  expect(r).toEqual({ ok: true, values: { modo: 'individual', personas: [{ name: 'Ana', day: 3, month: 11 }], mensaje: '¡Feliz cumpleaños!' } })
})
it('cumpleaños: 29 de febrero válido; 31 de abril y 30 de febrero no', () => {
  expect(validateValues(cumple, { personas: [{ name: 'Ana', day: 29, month: 2 }] }).ok).toBe(true)
  expect(validateValues(cumple, { personas: [{ name: 'Ana', day: 31, month: 4 }] }))
    .toEqual({ ok: false, errors: { 'personas.0': 'Ese día no existe en ese mes.' } })
})
it('cumpleaños: sin personas, nombre vacío, día fuera de rango', () => { /* mensajes exactos de la tabla */ })
it('claves desconocidas se descartan', () => { /* { ...culto válido, extra: 1 } → values sin 'extra' */ })
```

`mensaje` toma su `defaultValue` cuando falta (aplica a cualquier campo con `defaultValue`).

- [ ] **Step 3: Ejecutar para verlas fallar** — `pnpm test:unit -- validation` · FAIL.
- [ ] **Step 4: Implementar `validation.ts`.**
- [ ] **Step 5: Ejecutar** — `pnpm test:unit` · PASS.
- [ ] **Step 6: Actualizar HANDOFF.md y hacer commit** — `feat(tipos): validación de valores en español con Zod [RF-04, §3.3]`

---

### Task 4: Base de datos local (Dexie) y repositorio genérico

**Files:**
- Create: `src/data/local/db.ts`, `src/data/local/repository.ts`, `src/data/models.ts`
- Modify: `package.json` (`pnpm add -D fake-indexeddb`), `HANDOFF.md`
- Test: `tests/unit/data/repository.test.ts`

**Interfaces:**
- Produces (`models.ts`): `SyncMeta`, `Announcement`, `Presentation`, `Theme`, `Settings`, `ImageAsset` y `ImageKind = 'foto' | 'flyer' | 'logo' | 'asset'` **tal como §7**; `Ministry` y `LogoVariant` se definen en la Tarea 7. `Announcement.values` es `Record<string, unknown>`.
- Produces (`db.ts`): `class AppDb extends Dexie` con versión 1:

```ts
announcements: 'id, typeId, eventDate, status, updatedAt'
ministries:    'id, updatedAt'
images:        'id, &hash, kind, updatedAt'
imageBlobs:    'id'                 // { id, blob }: el Blob solo vive local (§7)
presentations: 'id, date, updatedAt'
themes:        'id, updatedAt'
settings:      'id'
```

  `createDb(name = 'anuncios-del-sabado'): AppDb`.
- Produces (`repository.ts`):

```ts
export interface Repository<T extends SyncMeta> {
  put(record: Omit<T, 'id' | 'updatedAt'> & { id?: string }): Promise<T> // id = crypto.randomUUID() si falta; updatedAt = clock()
  get(id: string): Promise<T | undefined>                                 // undefined si está borrado
  list(): Promise<T[]>                                                    // sin borrados, ordenados por updatedAt descendente
  remove(id: string): Promise<void>                                       // borrado lógico: deletedAt = updatedAt = clock()
}
export function createRepository<T extends SyncMeta>(table: Table<T, string>, clock?: () => Date): Repository<T>
```

  Las fechas de `SyncMeta` son ISO (`toISOString()`).

- [ ] **Step 1: Instalar** — `pnpm add -D fake-indexeddb`.
- [ ] **Step 2: Escribir las pruebas que fallan** (importar `fake-indexeddb/auto`; una base con nombre único por prueba)

```ts
type Item = SyncMeta & { name: string }
it('put asigna id y updatedAt con el reloj inyectado', async () => { /* clock fijo → updatedAt === '2026-11-01T12:00:00.000Z'; id con formato UUID */ })
it('put con id existente actualiza y mueve updatedAt', async () => { /* segundo put con otro clock → mismo id, name nuevo, updatedAt nuevo */ })
it('remove es lógico: desaparece de get y list pero sigue en la tabla con deletedAt', async () => { /* table.get(id).deletedAt === ISO del clock */ })
it('list ordena por updatedAt descendente', async () => { /* … */ })
it('createDb declara las 7 tablas', () => { /* db.tables.map(t => t.name).sort() */ })
```

- [ ] **Step 3: Ejecutar para verlas fallar** — `pnpm test:unit -- repository` · FAIL.
- [ ] **Step 4: Implementar** `models.ts`, `db.ts`, `repository.ts`.
- [ ] **Step 5: Ejecutar** — `pnpm test:unit` · PASS.
- [ ] **Step 6: Actualizar HANDOFF.md y hacer commit** — `feat(datos): Dexie local-first con borrado lógico [RF-100, §8.4]`

---

### Task 5: Guardar imágenes (comprimir, medir, hash, deduplicar)

**Files:**
- Create: `src/data/local/images.ts`
- Test: `tests/browser/data/images.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: `AppDb`, `ImageAsset`, `ImageKind` (Tarea 4).
- Produces:
  - `class InvalidImageError extends Error` — mensaje `No se pudo leer la imagen. Usa un archivo PNG, JPG, WebP o SVG.`
  - `MAX_SIDE = { default: 2560, foto: 1600 }`, `WEBP_QUALITY = 0.82`
  - `prepareImage(blob: Blob, kind: ImageKind): Promise<{ blob: Blob; width: number; height: number }>` — SVG (`image/svg+xml`) se devuelve igual con sus dimensiones naturales; PNG/JPEG/WebP se decodifican con `createImageBitmap`, se reducen si el lado mayor supera el límite (nunca se agrandan) y se codifican a WebP con `OffscreenCanvas.convertToBlob`. Otro tipo o fallo al decodificar → `InvalidImageError`.
  - `saveImage(db: AppDb, blob: Blob, kind: ImageKind, clock?: () => Date): Promise<ImageAsset>` — prepara, calcula SHA-256 (hex) del resultado con `crypto.subtle`; si ya existe una imagen no borrada con ese `hash`, la devuelve sin crear nada; si no, guarda `ImageAsset` (`storagePath: \`images/${hash}.${webp|svg}\``) y `{ id, blob }` en `imageBlobs` en una sola transacción.
  - `getImageBlob(db: AppDb, id: string): Promise<Blob | undefined>`

- [ ] **Step 1: Escribir las pruebas que fallan** (Chromium real; las imágenes de prueba se generan con `OffscreenCanvas` dentro de la prueba)

```ts
it('foto de 4000×3000 → WebP de 1600×1200', async () => { /* width/height y blob.type === 'image/webp' */ })
it('flyer de 4000×3000 → 2560×1920; uno de 800×1200 no se agranda', async () => { /* … */ })
it('SVG se guarda tal cual', async () => { /* blob.type 'image/svg+xml', mismo texto, storagePath termina en .svg */ })
it('la misma imagen dos veces → un solo registro', async () => { /* mismos id; db.images.count() === 1 */ })
it('un archivo que no es imagen → InvalidImageError y nada guardado', async () => { /* new Blob(['hola'], { type: 'text/plain' }) y PNG corrupto; count() === 0 */ })
it('hash SHA-256 en hex de 64 caracteres y ruta basada en él', async () => { /* /^[0-9a-f]{64}$/ */ })
it('getImageBlob devuelve el blob guardado', async () => { /* … */ })
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `pnpm test:browser -- images` · FAIL.
- [ ] **Step 3: Implementar `images.ts`.**
- [ ] **Step 4: Ejecutar** — `pnpm test` · PASS.
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(datos): imágenes comprimidas y sin duplicados [RNF-04, §8.4]`

---

### Task 6: Color dominante de un logo

**Files:**
- Create: `src/lib/dominantColor.ts`
- Test: `tests/unit/lib/dominantColor.test.ts`, `tests/browser/lib/dominantColor.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: `toHex` del motor (`src/slides/engine`).
- Produces:
  - `dominantColor(pixels: { data: Uint8ClampedArray; width: number; height: number }): string | null` — ignora píxeles con alfa < 128; agrupa en cubetas de 4 bits por canal (`r >> 4, g >> 4, b >> 4`); la cubeta con más píxeles gana (empate → la de clave numérica menor); devuelve el promedio de esa cubeta en `#rrggbb`. Sin píxeles opacos → `null`.
  - `dominantColorOfBlob(blob: Blob): Promise<string | null>` — dibuja la imagen reducida a ≤ 64 px de lado en un `OffscreenCanvas` (SVG vía `<img>` + `decode()`) y llama a `dominantColor`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// unit: construir pixels a mano
it('color mayoritario', () => { /* 70 px #1e5aa8 + 30 px #ffffff → '#1e5aa8' */ })
it('ignora la transparencia', () => { /* 90 px transparentes + 10 px #c62828 → '#c62828' */ })
it('todo transparente → null', () => { /* … */ })
it('determinista ante empates', () => { /* 50/50 → mismo resultado dos veces y la cubeta de clave menor */ })
// browser
it('dominantColorOfBlob de un SVG de prueba', async () => { /* SVG con rect #1e5aa8 de 80 % del área → '#1e5aa8' (±1 por canal) */ })
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `pnpm test -- dominantColor` · FAIL.
- [ ] **Step 3: Implementar `dominantColor.ts`.**
- [ ] **Step 4: Ejecutar** — `pnpm test` · PASS.
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat: color dominante de logos [RF-37, §5.5]`

---

### Task 7: Ministerios, logo de la iglesia y candidatos para el motor

**Files:**
- Create: `src/data/ministries.ts`
- Ya en el repo (copiados del responsable el 2026-11-01): `src/assets/logos/iglesia/iasd-horizontal-negro.svg`, `iasd-horizontal-blanco.svg`, `iasd-vertical-negro.svg`, `iasd-vertical-blanco.svg`
- Modify: `src/data/models.ts`, `LICENSES.md`, `HANDOFF.md`, `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md`
- Test: `tests/unit/data/ministries.test.ts`, `tests/browser/data/ministries.test.ts`

**Interfaces:**
- Consumes: `LogoCandidate`, `LogoOrientation`, `selectLogoVariant` (motor P1); `createRepository`, `AppDb` (Tarea 4); `dominantColorOfBlob` (Tarea 6).
- Produces (`models.ts`), §7 con `dominantColor` añadido (obligatorio en `'color'`, porque el motor lo necesita para medir el contraste ≥ 3:1) y logos precargados por URL:

```ts
export type LogoSource = { kind: 'asset'; src: string } | { kind: 'image'; imageId: string }
export type LogoVariant = { source: LogoSource; orientation: LogoOrientation } & (
  | { color: 'blanco' } | { color: 'negro' } | { color: 'color'; dominantColor: string })
export interface Ministry extends SyncMeta { name: string; isChurch: boolean; logos: LogoVariant[] }
```

- Produces (`ministries.ts`):
  - `CHURCH_MINISTRY_ID = 'iglesia'`
  - `PRELOADED_MINISTRIES: readonly Ministry[]` — solo "Iglesia" (`isChurch: true`, `updatedAt: '2026-11-01T00:00:00.000Z'`) con las 4 variantes reales (fuente `asset`, `src` importado con Vite): `negro` y `blanco` × `horizontal` (archivos "lateral") y `vertical` (archivos "centrado"). El logo oficial es monocromo: **no hay variante `color`**.
  - `listMinistries(db: AppDb): Promise<Ministry[]>` — la iglesia primero, luego los guardados en Dexie (sin borrados) por nombre con `localeCompare(…, 'es')`. Un ministerio guardado con id `'iglesia'` no reemplaza al precargado.
  - `logoCandidatesFor(selection: Announcement['logo'], ministries: readonly Ministry[]): LogoCandidate[]` — `iglesia` → logos de la iglesia; `ninguno` → `[]`; `ministerio` → logos de ese ministerio, o `[]` si ya no existe. El `id` de cada candidato es `src` o `imageId`.
  - `logoUrlFor(candidateId: string, ministries: readonly Ministry[]): LogoSource | undefined` — para que P3 dibuje la variante elegida.

**Logos de la iglesia (§13.2-A resuelta en parte):** SVG oficiales IASD, solo trazados (sin texto, fuentes ni recursos externos), relleno `#12100b` o `#ffffff` vía `var(--fill-color)` en su `style`. Su `viewBox` incluye 40 unidades de margen propio: P3 lo tendrá en cuenta al medir el alto del logo (90–160 px). **Pendiente del responsable: el isotipo**; cuando llegue se agrega como variantes `cuadrado` (negro y blanco) sin tocar el código, solo `PRELOADED_MINISTRIES`. En `LICENSES.md`: el logo IASD es marca de la Iglesia Adventista del Séptimo Día, **no** está cubierto por la licencia MIT del proyecto y se usa según las normas de identidad de la iglesia.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// unit
it('la iglesia está precargada con 4 variantes: negro y blanco, horizontal y vertical', () => {
  /* PRELOADED_MINISTRIES[0]: id 'iglesia', isChurch; pares (color, orientation) exactamente
     [negro,horizontal] [blanco,horizontal] [negro,vertical] [blanco,vertical] */
})
it('logoCandidatesFor', () => {
  // iglesia → 4 candidatos; ninguno → []; ministerio existente → sus logos; ministerio borrado/inexistente → []
})
it('con el motor: fondo oscuro → blanco; fondo claro → negro; respeta la orientación pedida', () => {
  const c = logoCandidatesFor({ kind: 'iglesia' }, PRELOADED_MINISTRIES)
  expect(selectLogoVariant(c, '#0b1f3a')!.candidate.id).toMatch(/iasd-horizontal-blanco/)
  expect(selectLogoVariant(c, '#ffffff')!.candidate.id).toMatch(/iasd-horizontal-negro/)
  expect(selectLogoVariant(c, '#ffffff', { orientation: 'vertical' })!.candidate.id).toMatch(/iasd-vertical-negro/)
  expect(selectLogoVariant(c, '#777777')!.plate).toBeNull() // gris medio: blanco o negro llegan a 3:1
})
it('listMinistries: iglesia primero, luego por nombre, sin borrados, sin reemplazar la iglesia', async () => { /* fake-indexeddb */ })
it('logoUrlFor resuelve asset e image', () => { /* … */ })
// browser
it('cada logo precargado se ve del color que declara', async () => {
  /* fetch de cada src (mismo origen, empaquetado) → dominantColorOfBlob: 'negro' ≈ '#12100b' y 'blanco' ≈ '#ffffff' (±8 por canal) */
})
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `pnpm test -- ministries` · FAIL.
- [ ] **Step 3: Implementar** `models.ts` y `ministries.ts`; anotar la marca IASD en `LICENSES.md`.
- [ ] **Step 4: Verificación completa** — `pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` · 0 errores de tipos; todo en verde; el build sigue sin solicitudes externas (la E2E de P1 lo cubre).
- [ ] **Step 5: Actualizar HANDOFF.md** (P2 terminado, API nueva, próximo = plan de P3) **y la hoja de ruta; hacer commit** — `feat(ministerios): logo de la iglesia y candidatos para el motor [RF-35, RF-36, RF-38, §13.2-A]`
