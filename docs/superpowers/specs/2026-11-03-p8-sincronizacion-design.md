# P8 · Supabase y sincronización local-first — diseño

**Fecha:** 2026-11-03 · **SRS:** §11 paso 8, RF-100, RF-101, RF-102, RNF-11, §8.4, §8.5 · **Estado:** aprobado en conversación

## Objetivo

Que lo que prepara cualquier persona del equipo, en su PC o su celular, aparezca en la laptop de la
iglesia antes del sábado, sin que la app deje de funcionar ni de presentar sin internet (C-03).

## Decisiones tomadas con el responsable

| Tema | Decisión |
|---|---|
| Inquilinos | **Una sola iglesia** (Mansedumbre II). Multitenant queda para el futuro si hace falta. |
| Entrada | **Código de 6 dígitos por correo** (OTP), sin contraseñas. Google, más adelante. |
| Sesión | Se guarda en el navegador y se renueva sola; el código se pide una vez por equipo. |
| Autorización | **Cualquier editor** añade o quita correos desde la página **Equipo**. |
| Motor | **Sincronizador propio** sobre Dexie (outbox + pull por cursor). Sin librerías de sync. |
| Conflictos | **Gana la última edición hecha** (`updated_at` del cliente), no la última en llegar. |

Fuera de alcance: vista de lectura pública y OG "A" (paso 9), respaldo `.zip` (paso 10), Google,
varias iglesias, limpieza de archivos en Storage, Realtime.

## 1. Base de datos (Supabase/Postgres)

### Tablas sincronizadas

`announcements`, `ministries`, `images`, `presentations`, `themes`, `settings`. Todas con la misma forma:

```sql
id          text primary key,           -- UUID del cliente; 'configuracion' para settings
data        jsonb not null,             -- el registro de Dexie completo (sin Blobs)
updated_at  timestamptz not null,       -- hora de la edición en el equipo (decide conflictos)
deleted_at  timestamptz,                -- borrado lógico
synced_at   timestamptz not null default clock_timestamp()  -- hora de llegada (cursor de bajada)
```

Índice `(synced_at)` en cada tabla. Documento jsonb: un tipo de anuncio que gana un campo no exige
migración. Las columnas para consultar (fecha, publicada, slug) se añaden en el paso 9.

### Funciones

- `sync_push(p_table text, p_rows jsonb) returns int` — `security invoker`. Valida que `p_table` sea una
  de las seis. Por cada fila `{id, data, updated_at, deleted_at}` hace
  `insert … on conflict (id) do update … where excluded.updated_at > tabla.updated_at`, fijando
  `synced_at = clock_timestamp()`. Devuelve cuántas filas cambió. Una fila igual o más vieja no hace nada.
- `ping() returns int` — `select 1`, ejecutable por `anon`. Lo usa el keep-alive.
- `is_editor() returns boolean` — `security definer`, `stable`: el correo de `auth.jwt()` está en `editors`.
- `can_sign_in(p_email text) returns boolean` — `security definer`, ejecutable por `anon`: la pantalla
  Entrar avisa "Este correo no está en el equipo" antes de pedir el código. (Revela si un correo es del
  equipo; aceptable para este caso.)
- `before_user_created(event jsonb) returns jsonb` — *Auth hook*: rechaza crear un usuario cuyo correo
  no esté en `editors`. Activarlo es un paso manual en el panel (ver §6).

### Equipo

```sql
editors (email text primary key check (email = lower(email)), added_by text, added_at timestamptz default now())
```

### Permisos (RLS, RNF-11)

- Tablas sincronizadas: `select`, `insert`, `update` solo si `is_editor()`. Sin `delete` (borrado lógico).
- `editors`: `select` e `insert` si `is_editor()`; `delete` si `is_editor()` **y** el correo borrado no es
  el propio (nadie se quita a sí mismo, el equipo nunca queda vacío por accidente).
- `anon`: solo `ping()` y `can_sign_in()`.
- El primer editor (el responsable) se inserta con SQL directo en el proyecto, **nunca en una migración**
  (el repositorio es público).

### Storage

Bucket **privado** `images`. Políticas: `select` e `insert` para `is_editor()`. La ruta es la
`storagePath` ya existente (`images/<sha256>.<ext>`). Abrirlo al público se decide en el paso 9.

## 2. Cambios locales (Dexie v3)

- Tabla nueva `outbox`: `'[table+id], table'` con `{ table, id }`. Guarda **qué** cambió, no una copia.
- Tabla nueva `syncState`: `'key'` — `{ key: 'cursor:<tabla>', value: string }` y `lastSyncAt`.
- `images`: el índice `&hash` pasa a `hash` (no único). Dos equipos que guardan la misma foto sin red
  crean dos registros con ids distintos y el mismo archivo; bajar el del otro ya no choca. `saveImage`
  sigue reutilizando el primero que encuentra.
- **Toda escritura local deja su entrada en `outbox` en la misma transacción:** `createRepository`
  (`put`, `remove`) y `saveImage`. Las transacciones que envuelven repositorios
  (`usePresentations`, `usePresentationRecord`) incluyen `db.outbox` en su alcance.
- Las escrituras que vienen de la nube usan la tabla directamente y **no** tocan `outbox`.

## 3. Sincronizador (`src/data/sync/`)

Interfaces para poder probar sin red:

```ts
interface SyncRemote {
  push(table: SyncTable, rows: RemoteRow[]): Promise<void>
  pull(table: SyncTable, since: string | null, limit: number): Promise<RemoteRow[]>
  uploadFile(path: string, blob: Blob): Promise<void>      // "ya existe" cuenta como éxito
  downloadFile(path: string): Promise<Blob>
}
interface RemoteRow { id: string; data: object; updated_at: string; deleted_at: string | null; synced_at?: string }
```

**Una vuelta (`runSync`)**:

1. **Subir.** Agrupa `outbox` por tabla. Por cada entrada lee el registro actual. Para `images`, sube
   antes el Blob a `storagePath` (si falta el Blob local, la entrada espera). Envía lotes de 100. Al
   confirmar, borra de `outbox` solo las entradas cuyo registro conserva el `updatedAt` leído: lo
   editado durante la subida se queda para la próxima vuelta.
2. **Bajar.** Si hay una presentación en curso (§3.2), se salta. Por tabla pide
   `synced_at > cursor − 60 s` en páginas de 500. Aplica un registro solo si no existe localmente o su
   `updated_at` es más nuevo; si ese id está en `outbox` con un `updatedAt` local más nuevo, gana el
   local. Guarda el cursor = mayor `synced_at` recibido.
3. **Imágenes faltantes.** Por cada `images` vivo sin Blob local, descarga el archivo en segundo plano.
   `checkOffline` ("Preparar sin internet") llama a esta descarga antes de evaluar si hay red.

### 3.1 Cuándo corre

Al arrancar, al volver la red (`online`), al volver a la pestaña (`visibilitychange`), 2 s después
del último cambio en `outbox` y cada 5 min. Una sola pestaña a la vez: `navigator.locks.request
('anuncios-sync', { ifAvailable: true })`. Sin `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`
el sincronizador no arranca y la app funciona exactamente como hoy.

### 3.2 Durante una presentación

Las páginas del presentador y de una ventana sostienen el lock compartido `anuncios-presentando`
mientras están abiertas. El sincronizador consulta `navigator.locks.query()`: si está tomado, sube pero
**no aplica** lo que baja (la ventana pública no cambia a mitad del sermón).

### 3.3 Estado (RF-101)

| Estado | Cuándo |
|---|---|
| `sincronizado` | `outbox` vacío y la última vuelta salió bien |
| `pendiente` (n) | hay entradas en `outbox`; el panel muestra n también en los estados de error |
| `sin-conexion` | `navigator.onLine === false` o falla la red |
| `sin-sesion` | no hay sesión, o el servidor responde 401/403 |
| `nube-no-responde` | Supabase pausado o caído (5xx, timeout) |
| `desactivado` | no hay variables de entorno (no se muestra nada) |

Prioridad: `desactivado` > `sin-sesion` > `sin-conexion` > `nube-no-responde` > `pendiente` > `sincronizado`.
Reintentos tras error: 30 s, 1 min, 2 min… hasta 15 min. Un lote rechazado (4xx distinto de 401/403)
no frena a las demás tablas; se queda en `outbox`.

## 4. Interfaz

- **Indicador** en `AppHeader`: texto corto con icono (Sincronizado · Cambios pendientes · 3 · Sin
  conexión · Entra para sincronizar · La nube no responde). Al pulsarlo, un panel con la última
  sincronización y "Sincronizar ahora" o "Entrar". Componentes en `src/features/sync/`.
- **Entrar** (`/entrar`): paso 1 correo (con `can_sign_in`), paso 2 código de 6 dígitos
  (`verifyOtp({ type: 'email' })`). Mensajes en español, sin jerga. Tras entrar, vuelve a donde estaba
  y pide `navigator.storage.persist()` (RF-102).
- **Equipo** (`/equipo`, enlace en el panel del indicador cuando hay sesión): lista de correos, campo
  para añadir, botón para quitar (deshabilitado en el propio), y "Cerrar sesión". Cerrar sesión no borra
  los datos locales; si hay pendientes, avisa antes.
- Tailwind y componentes `Ui*` existentes; DESIGN.md (NDS Core).

## 5. Configuración y despliegue

- Dependencia nueva: `@supabase/supabase-js`, importada de forma diferida solo si hay variables.
- Variables públicas de build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (GitHub Actions
  *variables* en `deploy.yml`; `.env.local` en desarrollo). Las E2E y `ci.yml` corren sin ellas.
- Migraciones en `supabase/migrations/`, aplicadas al proyecto con las herramientas de Supabase.
- `.github/workflows/keep-alive.yml`: cada 3 días (`cron: '0 12 */3 * *'`) y a mano, `POST
  /rest/v1/rpc/ping` con la clave pública. GitHub desactiva los cron tras 60 días sin commits (anotado
  en HANDOFF).

## 6. Pasos manuales del responsable

1. Confirmar la creación del proyecto (plan gratuito, `us-east-1`).
2. SMTP propio en Supabase (buzón de Hostinger, p. ej. `no-responder@jose-web.com`): sin él, el código
   solo llega a miembros de la organización de Supabase.
3. Plantilla de correo "Magic Link" con `{{ .Token }}` (el código), en español.
4. Activar el hook `before_user_created` en Auth → Hooks.
5. Crear las *variables* de GitHub Actions `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

## 7. Pruebas

- **Sincronizador** (unitarias, `fake-indexeddb` + `SyncRemote` en memoria): subir y bajar; gana la
  última edición; edición durante la subida; no aplicar durante una presentación; imagen: archivo antes
  que registro y descarga de faltantes; dos imágenes con el mismo hash; errores de red, 401 y 5xx →
  estado correcto; sin variables → desactivado; `outbox` en cada escritura de repositorio y `saveImage`.
- **Base de datos** (Vitest + **PGlite**, Postgres en WASM, sin Docker): las migraciones sobre un
  stub mínimo de Supabase (`auth.jwt()`, roles `anon`/`authenticated`). Casos: un correo fuera de
  `editors` no lee ni escribe; `sync_push` no pisa con una fila más vieja; nadie se quita a sí mismo;
  `anon` solo llama a `ping` y `can_sign_in`; el hook rechaza correos ajenos.
  *Desviación del diseño conversado (pgTAP + `supabase start` en CI):* Docker no está disponible aquí;
  PGlite corre en local y en CI. Riesgo: diferencias con Supabase real, mitigado aplicando las
  migraciones al proyecto y revisando `get_advisors`.
- **Interfaz** (componentes): Entrar (correo no autorizado, código incorrecto, éxito), Equipo (añadir,
  quitar, no quitarse), indicador (cada estado).
- **Manual (criterio 10 del SRS):** anuncio creado en el celular aparece en la laptop; ediciones sin red
  se suben al volver.
