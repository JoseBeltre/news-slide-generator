# P8 · Supabase y sincronización local-first — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sincronizar los datos de Dexie con Supabase (outbox + pull por cursor, gana la última edición) con entrada por código de correo y página Equipo, sin romper el uso y la presentación sin internet.

**Architecture:** Dexie sigue siendo la fuente de verdad. Cada escritura local deja `{table,id}` en `outbox` dentro de su transacción. `src/data/sync/` sube la cola a `sync_push` y baja por `synced_at` mediante una interfaz `SyncRemote` (en memoria en las pruebas, Supabase en producción). Un servicio programa las vueltas y expone el estado al indicador del encabezado.

**Tech Stack:** Vue 3, TS, Dexie 4, `@supabase/supabase-js`, Postgres/Supabase (RLS, RPC, Storage), Vitest (+ `fake-indexeddb`, + `@electric-sql/pglite` para SQL), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-03-p8-sincronizacion-design.md`

## Global Constraints

- Presentar y editar funcionan sin red y sin sesión (C-03). Sin `VITE_SUPABASE_URL` el sincronizador no arranca.
- Ningún secreto en el código; solo la clave pública (`VITE_SUPABASE_PUBLISHABLE_KEY`). Ningún correo personal en migraciones.
- UI solo con Tailwind y componentes `Ui*`; carpetas por funcionalidad (`src/features/sync/`), componentes pequeños.
- Textos de la interfaz en español, sin jerga: "Sincronizado", "Cambios pendientes · n", "Sin conexión", "Entra para sincronizar", "La nube no responde".
- Commits en español con IDs del SRS y `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; HANDOFF.md en el último commit.
- Tablas sincronizadas, en este orden: `announcements`, `ministries`, `images`, `presentations`, `themes`, `settings`.

## Review Focus

1. Un registro editado mientras su lote se sube no debe perderse (queda en `outbox`).
2. Una bajada nunca pisa un cambio local más nuevo que aún no se subió.
3. Bajar un registro `images` con un hash que ya existe localmente con otro id no debe fallar.
4. Nada de lo que baja se aplica mientras el presentador o la ventana única están abiertos.
5. Sin variables de entorno, ninguna parte de la app importa Supabase ni muestra el indicador.

---

### Task 1: Dexie v3 — outbox, estado y hash no único

**Files:**
- Modify: `src/data/local/db.ts`, `src/data/local/repository.ts`, `src/data/local/images.ts`, `src/data/models.ts`
- Modify: `src/features/presentations/shared/usePresentations.ts:28`, `src/features/presentations/shared/usePresentationRecord.ts:27` (añadir `db.outbox` al alcance)
- Test: `tests/unit/data/outbox.test.ts`

**Interfaces — Produces:**
- `models.ts`: `type SyncTable = 'announcements'|'ministries'|'images'|'presentations'|'themes'|'settings'`, `const SYNC_TABLES: readonly SyncTable[]`, `interface OutboxEntry { table: SyncTable; id: string }`, `interface SyncStateEntry { key: string; value: string }`.
- `AppDb.outbox: Table<OutboxEntry, [SyncTable, string]>` (`'[table+id], table'`), `AppDb.syncState: Table<SyncStateEntry, string>` (`'key'`); v3 cambia `images` a `'id, hash, kind, updatedAt'`.
- `repository.put/remove` escriben en `outbox` en la misma transacción cuando `table.db` tiene la tabla `outbox` (las pruebas con Dexie genérico siguen igual).

- [ ] Step 1: pruebas que fallan en `outbox.test.ts`: `put` de anuncio deja `{table:'announcements',id}`; diez `put` del mismo id dejan una entrada; `remove` deja entrada; `saveImage` deja `{table:'images'}`; crear presentación con `usePresentations`-equivalente dentro de una transacción con `db.outbox` funciona; `db.images.put` de dos registros con el mismo `hash` y distinto id no lanza.
- [ ] Step 2: `pnpm vitest run --project unit tests/unit/data/outbox.test.ts` → FAIL.
- [ ] Step 3: implementar (v3 en `db.ts`; `table.db.transaction('rw', table, 'outbox', …)` en repositorio; `db.outbox` en la transacción de `saveImage` y de las dos composables).
- [ ] Step 4: `pnpm test` → todo verde.
- [ ] Step 5: commit `feat(sync): cola de cambios locales en Dexie v3 [RF-100, §8.4]`.

### Task 2: Migraciones SQL y pruebas con PGlite

**Files:**
- Create: `supabase/migrations/20261103000000_sync.sql`, `supabase/tests/stub.sql`
- Create: `tests/unit/db/helpers.ts`, `tests/unit/db/sync.test.ts`
- Modify: `package.json` (devDependency `@electric-sql/pglite`)

**Interfaces — Produces:** las seis tablas, `editors`, RLS, `sync_push(p_table text, p_rows jsonb) returns int`, `ping()`, `is_editor()`, `can_sign_in(p_email text)`, `before_user_created(event jsonb)`, bucket y políticas de `storage.objects` (el stub crea `storage.buckets`/`storage.objects` mínimos y `auth.jwt()` leyendo `current_setting('request.jwt.claims', true)`).
- `helpers.ts`: `openDb(): Promise<PGlite>` (stub + migración) y `as(db, email|null, sql, params)` que hace `set local role authenticated|anon` + claims dentro de una transacción.

- [ ] Step 1: pruebas que fallan: fuera de `editors` no lee ni escribe `announcements`; editor hace `sync_push` y la fila aparece con `synced_at`; `sync_push` con `updated_at` más viejo devuelve 0 y no cambia `data`; tabla inválida lanza; nadie borra su propio correo de `editors` pero sí otro; `anon` ejecuta `ping` y `can_sign_in` y no lee tablas; `before_user_created` devuelve `{error}` para correo ajeno y `{}` para uno del equipo.
- [ ] Step 2: `pnpm vitest run --project unit tests/unit/db` → FAIL (sin migración).
- [ ] Step 3: escribir la migración. Si PGlite no soporta roles/RLS, ledger un *Ruling* y probar las funciones sin cambio de rol.
- [ ] Step 4: verde + `pnpm test`.
- [ ] Step 5: commit `feat(sync): esquema, RLS y sync_push en Supabase [RNF-11, §8.5]`.

### Task 3: Motor de sincronización

**Files:**
- Create: `src/data/sync/types.ts`, `src/data/sync/push.ts`, `src/data/sync/pull.ts`, `src/data/sync/images.ts`, `src/data/sync/runSync.ts`
- Create: `tests/unit/data/sync/memoryRemote.ts`, `tests/unit/data/sync/runSync.test.ts`

**Interfaces — Produces:**
- `types.ts`: `SyncRemote`, `RemoteRow` (de la especificación §3), `class SyncError extends Error { kind: 'offline'|'auth'|'server'|'rejected' }`.
- `runSync(db: AppDb, remote: SyncRemote, opts: { isPresenting: () => Promise<boolean> }): Promise<{ pushed: number; pulled: number }>` — sube, baja (si no se presenta), guarda `syncState` `cursor:<tabla>` y `lastSyncAt`; lanza `SyncError` según el primer error de red/auth/servidor; los `rejected` no detienen otras tablas.
- `downloadMissingImages(db, remote): Promise<number>`.
- `memoryRemote()`: tablas en memoria con la misma regla de `sync_push`, `synced_at` creciente, archivos en un `Map`, y `fail(kind)` para simular errores.

- [ ] Step 1: pruebas que fallan (una por línea de Review Focus 1–4 más): subir y bajar entre dos `AppDb` con el mismo remoto; gana la edición más nueva en ambos sentidos; archivo subido antes del registro; imagen sin Blob local espera en `outbox`; descarga de imágenes faltantes; `remote.fail('offline')` → `SyncError('offline')` y `outbox` intacto; bajada no crea entradas en `outbox`; cursor con solape de 60 s no duplica.
- [ ] Step 2: FAIL.
- [ ] Step 3: implementar.
- [ ] Step 4: verde + `pnpm test`.
- [ ] Step 5: commit `feat(sync): motor de subida y bajada con la última edición como ganadora [RF-100, §8.4]`.

### Task 4: Servicio, estado y programación

**Files:**
- Create: `src/data/sync/service.ts`, `src/data/sync/status.ts`
- Test: `tests/unit/data/sync/service.test.ts`

**Interfaces — Produces:**
- `status.ts`: `type SyncStatus = 'desactivado'|'sin-sesion'|'sin-conexion'|'nube-no-responde'|'pendiente'|'sincronizado'`; `deriveStatus(input: { enabled: boolean; signedIn: boolean; online: boolean; lastError: SyncError['kind'] | null; pending: number }): SyncStatus` con la prioridad de la especificación §3.3; `nextDelay(failures: number): number` (30 s ×2, tope 15 min).
- `service.ts`: `createSyncService(deps: { db; remote: SyncRemote | null; signedIn: () => boolean; isPresenting; withLock: <T>(fn: () => Promise<T>) => Promise<T | undefined>; now?; timers? }): SyncService` con `state: Readonly<Ref<{ status: SyncStatus; pending: number; lastSyncAt: string | null }>>`, `syncNow(): Promise<void>`, `start(): void`, `stop(): void`. `start` engancha `online`, `visibilitychange`, cambios de `outbox` (liveQuery, debounce 2 s) y un intervalo de 5 min.

- [ ] Step 1: pruebas que fallan: tabla de `deriveStatus`; `nextDelay(0..6)`; `remote` nulo → `desactivado` y nunca llama a `runSync`; tras éxito `sincronizado` y `lastSyncAt`; con error `auth` → `sin-sesion`; cambio en `outbox` dispara una vuelta tras 2 s (timers falsos); `withLock` que devuelve `undefined` no cambia el estado.
- [ ] Step 2: FAIL. Step 3: implementar. Step 4: verde + `pnpm test`.
- [ ] Step 5: commit `feat(sync): servicio con estado, reintentos y una sola pestaña [RF-101]`.

### Task 5: Cliente Supabase, adaptador remoto y sesión

**Files:**
- Create: `src/data/sync/supabase.ts` (cliente diferido), `src/data/sync/supabaseRemote.ts`, `src/data/sync/auth.ts`
- Modify: `package.json` (`@supabase/supabase-js`), `src/env.d.ts` (tipos de `VITE_SUPABASE_*`), `.gitignore` (`.env.local` si falta)
- Test: `tests/unit/data/sync/supabaseRemote.test.ts`, `tests/unit/data/sync/auth.test.ts`

**Interfaces — Produces:**
- `supabaseConfig(env = import.meta.env): { url: string; key: string } | null`; `getClient(): Promise<SupabaseClient | null>` (import dinámico, una instancia).
- `createSupabaseRemote(client): SyncRemote` — `rpc('sync_push')`, `from(t).select().gt('synced_at', since).order('synced_at').limit(n)`, `storage.from('images').upload(path, blob, { upsert: false })` (409/"exists" = éxito), `download`; traduce errores: `TypeError`/fetch → `offline`, 401/403/PGRST301 → `auth`, ≥500 o 540/timeout → `server`, resto → `rejected`.
- `auth.ts`: `createAuth(client)` con `session: Ref<{ email: string } | null>`, `canSignIn(email)`, `sendCode(email)` (`signInWithOtp({ email, options: { shouldCreateUser: true } })`), `verifyCode(email, code)` (`verifyOtp({ type: 'email' })`), `signOut()`, `listEditors()`, `addEditor(email)` (minúsculas, valida formato), `removeEditor(email)`.

- [ ] Step 1: pruebas que fallan con un cliente falso: `supabaseConfig` sin variables → `null`; cada clase de error → `SyncError.kind` correcto; upload "already exists" → éxito; `addEditor(' Ana@X.com ')` inserta `ana@x.com`; `verifyCode` con error → mensaje "El código no es correcto o ya caducó."
- [ ] Step 2: FAIL. Step 3: implementar. Step 4: verde + `pnpm test` + `pnpm typecheck`.
- [ ] Step 5: commit `feat(sync): cliente de Supabase, entrada por código y equipo [RF-100, §8.5]`.

### Task 6: Integración en la app (indicador, presentación, sin internet)

**Files:**
- Create: `src/features/sync/useSync.ts` (plugin + inject del servicio y la sesión), `src/features/sync/SyncIndicator.vue`, `src/features/sync/SyncPanel.vue`, `src/features/presenting/shared/usePresentingLock.ts`
- Modify: `src/main.ts`, `src/app/AppHeader.vue`, `src/features/presenting/presenter/PresenterPage.vue`, `src/features/presenting/single/SingleWindowPage.vue`, `src/data/offline.ts` (+ `offlineEnv.ts`: descarga de imágenes faltantes antes de comprobar)
- Test: `tests/browser/features/sync/SyncIndicator.test.ts`, `tests/unit/data/offline.test.ts` (caso nuevo)

**Interfaces — Consumes:** Task 4 `SyncService`, Task 5 `getClient`, `createAuth`. **Produces:** `syncPlugin(service, auth)`, `useSync(): { service, auth } | null`; `usePresentingLock()` toma el lock compartido `anuncios-presentando` mientras el componente vive; `isPresenting()` en `service` consulta `navigator.locks.query()`.

- [ ] Step 1: pruebas que fallan: el indicador muestra cada texto de estado; con `desactivado` no renderiza nada; el panel ofrece "Sincronizar ahora" con sesión y "Entrar" sin ella; `checkOffline` con imagen sin Blob y env con `downloadMissing` la descarga y no reporta la imagen.
- [ ] Step 2: FAIL. Step 3: implementar; `main.ts` crea el servicio solo si `supabaseConfig()` no es `null`.
- [ ] Step 4: verde + `pnpm test` + `pnpm test:e2e --project=chromium` (sin variables: nada cambia).
- [ ] Step 5: commit `feat(sync): indicador de sincronización y pausa durante la presentación [RF-101, §8.4]`.

### Task 7: Páginas Entrar y Equipo

**Files:**
- Create: `src/features/sync/signin/SignInPage.vue`, `src/features/sync/signin/EmailStep.vue`, `src/features/sync/signin/CodeStep.vue`, `src/features/sync/team/TeamPage.vue`, `src/features/sync/team/EditorRow.vue`
- Modify: `src/app/router.ts` (`/entrar` → `entrar`, `/equipo` → `equipo`; sin sync, redirigen a inicio), `tests/unit/app/router.test.ts`
- Test: `tests/browser/features/sync/SignInPage.test.ts`, `tests/browser/features/sync/TeamPage.test.ts`

- [ ] Step 1: pruebas que fallan: correo no autorizado → "Este correo no está en el equipo. Pídele a alguien del equipo que te añada."; código incorrecto → mensaje de Task 5; éxito → vuelve a `redirect` o inicio y llama a `requestPersist`; Equipo lista correos, añade, quita y deshabilita "Quitar" en el propio; "Cerrar sesión" con pendientes pide confirmación (`useConfirm`).
- [ ] Step 2: FAIL. Step 3: implementar con `UiInput`, `UiButton`, `UiField`, `UiConfirm`, `UiPageHeader`. Step 4: verde + `pnpm test`.
- [ ] Step 5: commit `feat(sync): páginas Entrar y Equipo [RF-100, §8.5]`.

### Task 8: Keep-alive, despliegue y documentación

**Files:**
- Create: `.github/workflows/keep-alive.yml`, `.env.example`
- Modify: `.github/workflows/deploy.yml` (env `VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}` y la clave en el paso de build), `README.md`, `HANDOFF.md`
- Test: `tests/unit/workflows.test.ts`

- [ ] Step 1: prueba que falla: `keep-alive.yml` tiene `schedule` cada 3 días y `workflow_dispatch` y llama a `rpc/ping`; `deploy.yml` pasa las dos variables al build; `.env.example` sin valores.
- [ ] Step 2: FAIL. Step 3: implementar; README (sección Sincronización y pasos manuales del responsable) y HANDOFF.
- [ ] Step 4: `pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e --project=chromium`.
- [ ] Step 5: commit `ci(sync): keep-alive de Supabase y variables del build [§8.4, §11 paso 8]`.

### Después del plan (fuera de la rama, con confirmación del responsable)

Crear el proyecto Supabase, aplicar la migración, insertar el primer editor, `get_advisors`, y la lista de pasos manuales (SMTP, plantilla con `{{ .Token }}`, hook, variables de GitHub).
