# HANDOFF — Anuncios del Sábado

> **Regla de trabajo:** lee este archivo **antes de cada tarea** (si no está ya en el contexto: sesión nueva, después de un compact o en un subagente) y **actualízalo al terminar cada tarea**, en el mismo commit que la tarea. Es la memoria compartida entre sesiones y agentes.

## Estado actual

- **Fase:** 1 (MVP), pasos 1–7 en modo **solo local** (sin backend), según SRS §11.
- **Plan vigente:** `docs/superpowers/plans/2026-11-01-fase1-p1-base-y-motor.md` (pasos 1–2).
- **Hoja de ruta de la fase:** `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md` (pasos 1–7).
- **Aprobación:** P1 aprobado el 2026-11-01; ejecución **nativa** (inline, una revisión final de toda la rama).
- **Rama:** `fase1/p1-base-y-motor`.
- **Ledger de ejecución:** `.superpowers/sdd/2026-11-01-fase1-p1-base-y-motor/progress.md` (ignorado por git).
- **Hecho:** P1 · Tareas 1–2 (proyecto montado; PWA offline con `.htaccess` y E2E sin red).

## Próxima tarea

- P1 · Tarea 3: lienzo 1920×1080, área segura y `SlideCanvas.vue`.

## Decisiones tomadas

| Fecha | Decisión | Fuente |
|---|---|---|
| 2026-11-01 | §13.1 confirmado por el responsable (modo extendido, Windows + Chrome/Brave, logos, cumpleaños, cuentas, vista pública, Hostinger FTP, MIT). | SRS v1.3 §13.1 |
| 2026-11-01 | §13.2-A (logos de la iglesia): **no bloquea**; se usa un **logo de prueba** en SVG (variantes color/blanco/negro) hasta recibir los archivos reales. | SRS §13.2 |
| 2026-11-01 | §13.2-B: mínimos de §5 tal cual (pensados para ~12–15 m). §13.2-C y D no afectan a los pasos 1–7. | SRS §13.2 |
| 2026-11-01 | Pruebas que miden texto (ajuste, auditoría) corren en **Vitest browser mode con Chromium** (jsdom no calcula layout). La lógica pura corre en el proyecto `unit`. | Plan P1 |
| 2026-11-01 | Identificadores de código en inglés; textos de interfaz y valores de enumeraciones del modelo (§7) en español. | Plan P1 |
| 2026-11-01 | Versiones instaladas más nuevas que las del plan: **Vite 8, Vitest 5, TypeScript 6, Vue 3.5, Playwright 1.64**. La API de browser mode (`playwright()` + `test.projects`) es la misma que en Vitest 4. | Tarea 1 |
| 2026-11-01 | Un solo `tsconfig.json` (DOM + tipos de Node) en lugar de `tsconfig.app/node`: `vue-tsc --noEmit` no revisa proyectos referenciados. | Tarea 1 |
| 2026-11-01 | `globPatterns` de Workbox **sin** `webmanifest`: el plugin ya lo precachea y duplicarlo hace que el SW se instale vacío (`add-to-cache-list-conflicting-entries`) sin error visible. Si se toca `globPatterns`, correr `npm run test:e2e`. | Tarea 2 |
| 2026-11-01 | `registerType: 'prompt'`: una versión nueva nunca recarga la página en medio de una presentación. El aviso "nueva versión" llega en P4. | Tarea 2 |
| 2026-11-01 | La E2E de fuente offline usa `document.fonts.load()` (fuerza la descarga desde el precache); `check()` no carga nada. | Tarea 2 |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite). |
| `npm run build` | Typecheck + build de producción en `dist/`. |
| `npm run preview` | Sirve `dist/` en `http://localhost:4173`. |
| `npm run typecheck` | `vue-tsc --noEmit`. |
| `npm test` | Vitest: proyectos `unit` (Node) y `browser` (Chromium). |
| `npm run test:unit` / `npm run test:browser` | Un solo proyecto de Vitest. |
| `npm run test:e2e` | Playwright contra el build: hace `build` + `preview` en el puerto 4173 (reutiliza un servidor ya abierto ahí; ciérralo si el build cambió). |

Requisito de una sola vez: `npx playwright install chromium`.

## Problemas abiertos / bloqueos

- `npm audit`: 5 avisos *moderate* en dependencias de desarrollo (cadena de `editorconfig`, vía herramientas de Vue). No llegan al navegador; revisar al actualizar dependencias.

## Registro de tareas

| Fecha | Tarea | Resultado | Commit |
|---|---|---|---|
| 2026-11-01 | Lectura del SRS v1.3 y redacción de los planes | Planes escritos y aprobados | ver `git log` (docs) |
| 2026-11-01 | P1 · T1: montar Vite + Vue + TS estricto + Vitest unit/browser | typecheck OK; `npm test` 2/2 | 812ae6d |
| 2026-11-01 | P1 · T2: PWA offline, `.htaccess`, E2E sin red | `npm test` 5/5; `test:e2e` 2/2 | ver `git log` |
