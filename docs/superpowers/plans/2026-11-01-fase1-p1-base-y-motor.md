# P1 · Base y motor de legibilidad: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montar el proyecto (pasos 1–2 de SRS §11) y construir el motor que impone las reglas de legibilidad de §5: lienzo 1920×1080 escalado, contraste WCAG ≥ 7:1, ajuste automático de texto sin bajar nunca de los mínimos, selección de la variante de logo y una auditoría de slides reutilizable en las pruebas de plantillas.

**Architecture:** SPA Vue 3 + Vite + TypeScript estricto, PWA con precache completo (nada se carga de otro origen). El motor vive en `src/slides/engine/`: la lógica pura (contraste, reglas, búsqueda binaria, selección de logo) se prueba en Node; lo que mide el DOM (ajuste de texto, escalado, auditoría) se prueba en Chromium real con Vitest browser mode, porque jsdom no calcula layout.

**Tech Stack:** Vue 3, Vite, TypeScript, vite-plugin-pwa (Workbox), `@fontsource/atkinson-hyperlegible`, Dexie (solo instalado), Vitest 4 (proyectos `unit` y `browser` con `@vitest/browser-playwright`), `@vue/test-utils`, Playwright.

**Spec:** `SRS.md` v1.3 (§2.4, §5, §8.1, §8.2, §8.6, §8.7, RF-32, RF-37, RF-39). Hoja de ruta: `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md`.

## Global Constraints

- **HANDOFF.md:** leerlo antes de empezar cada tarea si no está en el contexto (sesión nueva, después de un compact, en un subagente). Actualizarlo al terminar cada tarea (Estado actual, Próxima tarea, Decisiones, Problemas abiertos, Registro con el hash del commit) y **añadirlo al commit de la tarea**.
- **C-01:** sin IA ni servicios de pago. Mismos datos + misma plantilla = misma slide (RNF-05): nada de `Math.random`, fechas ni orden no determinista en el motor.
- **C-03 / §0.6:** nada se carga desde una CDN ni de otro origen en tiempo de ejecución (fuentes, scripts, íconos). Todo se empaqueta y lo precachea el Service Worker.
- **C-04:** ningún texto informativo se renderiza por debajo de su mínimo; ningún contraste texto/fondo por debajo de 7:1. Lo impone el motor, no el usuario.
- **C-06:** lienzo lógico fijo **1920 × 1080** (16:9).
- **Área segura (§5.1):** margen **96 px** horizontal y **64 px** vertical → `{ x: 96, y: 64, width: 1728, height: 952 }`.
- **Mínimos (§5.3), en px del lienzo:** título 96 (preferido 120–150) · dato clave 68 (80–96) · secundario 52 (60–64) · nombre cumpleaños individual 120 (160–260) · nombres cumpleaños grupo 60 (72–96) · metadatos 36 (40).
- **Tipografía (§5.2):** Atkinson Hyperlegible empaquetada; la familia es un **token** (prop/variable CSS), nunca fija en el CSS. Bold 700 para título, datos clave y nombres; Regular 400 para secundario y metadatos. Interlineado **1.2**. Sin cursivas. MAYÚSCULAS solo en slots de una línea.
- **Contraste (§5.5):** fórmula de luminancia relativa WCAG 2.x; texto ≥ **7:1**; logo ≥ **3:1** (color dominante vs fondo). Con degradados, se cumple contra **cada** parada.
- **Logo (RF-39):** alto entre **90** y **160** px (portada: hasta 400, decisión de este plan).
- **TypeScript estricto** (`strict: true`, `noUncheckedIndexedAccess: true`). Identificadores en inglés; textos visibles y enumeraciones del modelo (§7) en español.
- **Commits:** mensaje en español con los IDs del SRS, por ejemplo `feat(motor): contraste WCAG [RNF-02, RF-32]`, y al final la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Licencias (RNF-09):** cada dependencia nueva de runtime se anota en `LICENSES.md`.

## Review Focus

- **Palabra larga sin cortes** ("Otorrinolaringología", "809-555-1234") en un slot estrecho → se reduce el tamaño o se informa "No cabe"; nunca se parte a mitad de palabra ni desborda de forma invisible. Prueba en Tarea 7.
- **Medir antes de que cargue la fuente** → nunca se mide con las métricas de la fuente de respaldo; se lanza `FontNotLoadedError`. Prueba en Tarea 7.
- **Campo opcional vacío o solo espacios** → el slot no se dibuja (sin hueco, RNF-10), el informe dice `empty` y no cuenta como "No cabe". Pruebas en Tareas 7 y 8.
- **Contenedor de tamaño 0** (vista previa colapsada en el celular, pestaña oculta) → escala 0, sin `NaN`/`Infinity` ni excepciones. Prueba en Tarea 3.
- **Colores medios donde ni blanco ni negro llegan a 7:1** (`#777777`, degradados con una parada mala) → el motor ajusta el fondo de forma determinista. Pruebas en Tareas 4 y 10.

---

## Estructura de archivos

```
index.html                         # lang="es-DO"
package.json  tsconfig*.json  vite.config.ts  vitest.config.ts  playwright.config.ts  pwa-assets.config.ts
LICENSES.md   HANDOFF.md
public/.htaccess   public/icon.svg
src/main.ts  src/App.vue
src/slides/fonts.ts                # importa los CSS de @fontsource (400 y 700) + DEFAULT_FONT_FAMILY
src/slides/engine/
  types.ts        # Rect, TextRole, TextSlotDef, FitResult, FitReport
  canvas.ts       # CANVAS, SAFE_AREA, computeScale, isInsideSafeArea
  SlideCanvas.vue # lienzo 1920×1080 escalado con transform
  color.ts        # parseColor, contrastRatio, pickTextColor, ensureContrast…
  readability.ts  # TEXT_ROLES y constantes de §5, resolveFontRange, validateTextSlot, densidad
  fit.ts          # findLargestFittingSize (búsqueda binaria pura)
  measure.ts      # ensureFontLoaded, measureTextFit (DOM)
  FitText.vue     # texto ajustado a un slot, emite FitReport
  fitReport.ts    # summarizeFit → 'ok' | 'no_cabe'
  logo.ts         # selectLogoVariant, clampLogoHeight
  audit.ts        # auditSlide: verificación §5.7 sobre el DOM
  index.ts        # API pública del motor
tests/unit/       # Vitest, entorno node
tests/browser/    # Vitest browser mode (Chromium) + setup.ts
tests/e2e/        # Playwright contra el build (vite preview)
```

---

### Task 1: Montar Vite + Vue + TS estricto + Vitest (unit y browser)

**Files:**
- Create: `package.json`, `index.html`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `src/main.ts`, `src/App.vue`, `src/env.d.ts`, `src/slides/fonts-family.ts`, `src/slides/fonts.ts`, `tests/browser/setup.ts`, `.gitignore`, `LICENSES.md`
- Test: `tests/unit/smoke.test.ts`, `tests/browser/font.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Produces: `DEFAULT_FONT_FAMILY = 'Atkinson Hyperlegible'` definido en `src/slides/fonts-family.ts` (sin CSS, importable desde Node) y reexportado por `src/slides/fonts.ts`, que además registra las fuentes 400 y 700. Scripts npm: `dev`, `build`, `preview`, `typecheck`, `test`, `test:unit`, `test:browser`, `test:e2e`.

- [ ] **Step 1: Instalar dependencias**

```bash
npm init -y
npm i vue dexie @fontsource/atkinson-hyperlegible
npm i -D vite @vitejs/plugin-vue typescript vue-tsc @vue/tsconfig vitest @vitest/browser-playwright playwright @vue/test-utils @types/node
npx playwright install chromium
```

`package.json`: `"type": "module"`, `"private": true`, `"license": "MIT"`, `"name": "anuncios-del-sabado"`. Scripts:

```json
{
  "dev": "vite",
  "build": "vue-tsc --noEmit && vite build",
  "preview": "vite preview --port 4173 --strictPort",
  "typecheck": "vue-tsc --noEmit",
  "test": "vitest run",
  "test:unit": "vitest run --project unit",
  "test:browser": "vitest run --project browser",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 2: Configuración**

- `tsconfig.app.json` extiende `@vue/tsconfig/tsconfig.dom.json` con `strict: true`, `noUncheckedIndexedAccess: true`, `include: ["src/**/*", "tests/**/*"]`.
- `vite.config.ts`: `plugins: [vue()]`, `base: '/'`.
- `vitest.config.ts` (fusiona `vite.config.ts` con `mergeConfig`) con dos proyectos:

```ts
import { playwright } from '@vitest/browser-playwright'
// test.projects:
[
  { extends: true, test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
  { extends: true, test: {
      name: 'browser',
      include: ['tests/browser/**/*.test.ts'],
      setupFiles: ['tests/browser/setup.ts'],
      browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
  } },
]
```

  Si la versión instalada de Vitest no es la 4, adaptar a su sintaxis de browser mode y anotarlo en HANDOFF.md.
- `index.html`: `<html lang="es-DO">`, `<title>Anuncios del Sábado</title>`.
- `src/App.vue`: solo `<h1>Anuncios del Sábado</h1>` (la interfaz llega en P4).
- `src/slides/fonts.ts`: importa `@fontsource/atkinson-hyperlegible/400.css` y `/700.css`; reexporta `DEFAULT_FONT_FAMILY` de `fonts-family.ts`. `src/main.ts` y `tests/browser/setup.ts` importan `fonts.ts`.
- `.gitignore`: `node_modules`, `dist`, `test-results`, `playwright-report`, `.env*`, `.vitest-attachments`.
- `LICENSES.md`: proyecto MIT; Atkinson Hyperlegible — SIL OFL 1.1 (Braille Institute); Vue, Vite, Dexie — MIT/Apache-2.0 según corresponda.

- [ ] **Step 3: Escribir las pruebas de humo**

```ts
// tests/unit/smoke.test.ts
import { DEFAULT_FONT_FAMILY } from '../../src/slides/fonts-family'
it('la familia por defecto es Atkinson Hyperlegible', () => {
  expect(DEFAULT_FONT_FAMILY).toBe('Atkinson Hyperlegible')
})
```

```ts
// tests/browser/font.test.ts
it('Atkinson Hyperlegible 400 y 700 se cargan desde el bundle', async () => {
  const r400 = await document.fonts.load('400 100px "Atkinson Hyperlegible"')
  const r700 = await document.fonts.load('700 100px "Atkinson Hyperlegible"')
  expect(r400.length).toBeGreaterThan(0)
  expect(r700.length).toBeGreaterThan(0)
})
```

- [ ] **Step 4: Ejecutar**

Run: `npm run typecheck && npm test`
Expected: 0 errores de tipos; proyectos `unit` y `browser` en verde (2 pruebas).

- [ ] **Step 5: Actualizar HANDOFF.md** (sección Comandos con los scripts; Registro; Próxima tarea = Tarea 2) **y hacer commit**

```bash
git add -A
git commit -m "chore: montar Vite + Vue + TS estricto + Vitest unit/browser [paso 1 §11]"
```

---

### Task 2: PWA offline, `.htaccess` y E2E de "cero orígenes externos"

**Files:**
- Create: `public/.htaccess`, `public/icon.svg`, `pwa-assets.config.ts`, `playwright.config.ts`
- Modify: `vite.config.ts`, `package.json`, `LICENSES.md`, `HANDOFF.md`
- Test: `tests/unit/htaccess.test.ts`, `tests/e2e/offline.spec.ts`

**Interfaces:**
- Consumes: `index.html` con `<h1>Anuncios del Sábado</h1>` (Tarea 1).
- Produces: build con Service Worker que precachea JS, CSS, HTML, SVG, PNG, WebP, WOFF2 y el manifiesto; navegación de cualquier ruta → `index.html`.

- [ ] **Step 1: Instalar**

```bash
npm i -D vite-plugin-pwa @vite-pwa/assets-generator
```

- [ ] **Step 2: Escribir las pruebas que fallan**

```ts
// tests/unit/htaccess.test.ts — lee public/.htaccess con fs
it('hace fallback del SPA a index.html', () => {
  expect(ht).toMatch(/RewriteRule \. \/index\.html \[L\]/)
})
it('no cachea index.html, sw.js ni manifest.webmanifest', () => {
  expect(ht).toMatch(/index\\\.html\|sw\\\.js\|manifest\\\.webmanifest/)
  expect(ht).toContain('Header set Cache-Control "no-cache"')
})
it('cachea /assets/ un año e inmutable', () => {
  expect(ht).toContain('max-age=31536000, immutable')
})
```

```ts
// tests/e2e/offline.spec.ts
test('no hace ninguna solicitud a otro origen', async ({ page, baseURL }) => {
  const externas: string[] = []
  page.on('request', r => { if (new URL(r.url()).origin !== new URL(baseURL!).origin) externas.push(r.url()) })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  expect(externas).toEqual([])
})

test('funciona sin red después de la primera carga, también en rutas profundas', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload() // la página queda controlada por el SW
  await context.setOffline(true)
  await page.goto('/presentacion/cualquier-cosa')
  await expect(page.getByRole('heading', { name: 'Anuncios del Sábado' })).toBeVisible()
  expect(await page.evaluate(() => document.fonts.check('700 100px "Atkinson Hyperlegible"'))).toBe(true)
})
```

- [ ] **Step 3: Ejecutar para verlas fallar**

Run: `npm run test:unit -- htaccess` y `npm run test:e2e`
Expected: FAIL (no existe `.htaccess`; sin SW la recarga offline falla).

- [ ] **Step 4: Implementar**

- `public/.htaccess` (texto exacto, §8.6):

```apache
Options -MultiViews
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

<IfModule mod_mime.c>
  AddType application/manifest+json .webmanifest
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "^(index\.html|sw\.js|manifest\.webmanifest)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <If "%{REQUEST_URI} =~ m#^/assets/#">
    Header set Cache-Control "max-age=31536000, immutable"
  </If>
</IfModule>
```

- `vite.config.ts`: `VitePWA({ registerType: 'prompt', injectRegister: 'auto', manifest: { name: 'Anuncios del Sábado', short_name: 'Anuncios', lang: 'es-DO', display: 'standalone', background_color: '#0b1f3a', theme_color: '#0b1f3a' }, pwaAssets: { config: true }, workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,ico,webmanifest}'], navigateFallback: 'index.html' } })`. `registerType: 'prompt'` para que una actualización **nunca recargue la página en medio de una presentación**; la nueva versión se aplica al volver a abrir la app (el aviso de actualización llega en P4).
- `public/icon.svg`: ícono provisional (cuadrado azul `#0b1f3a` con una "A" blanca). `pwa-assets.config.ts` con el preset `minimal2023Preset` sobre `public/icon.svg`.
- `playwright.config.ts`: `testDir: 'tests/e2e'`, un proyecto `chromium`, `use.baseURL: 'http://localhost:4173'`, `webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI, timeout: 120_000 }`.
- `LICENSES.md`: vite-plugin-pwa / Workbox (MIT).

- [ ] **Step 5: Ejecutar**

Run: `npm run test:unit && npm run test:e2e`
Expected: PASS (3 pruebas de `.htaccess`, 2 E2E). Comprobar además que `dist/.htaccess` existe tras el build.

- [ ] **Step 6: Actualizar HANDOFF.md y hacer commit**

```bash
git add -A
git commit -m "feat: PWA con precache completo, .htaccess y E2E sin red [C-03, RNF-01]"
```

---

### Task 3: Lienzo, área segura y `SlideCanvas.vue`

**Files:**
- Create: `src/slides/engine/types.ts`, `src/slides/engine/canvas.ts`, `src/slides/engine/SlideCanvas.vue`
- Test: `tests/unit/engine/canvas.test.ts`, `tests/browser/engine/SlideCanvas.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Produces (`types.ts`): `interface Rect { x: number; y: number; width: number; height: number }`.
- Produces (`canvas.ts`):
  - `CANVAS = { width: 1920, height: 1080 } as const`
  - `SAFE_AREA: Readonly<Rect> = { x: 96, y: 64, width: 1728, height: 952 }`
  - `computeScale(containerWidth: number, containerHeight: number): { scale: number; offsetX: number; offsetY: number }` — ajuste tipo *contain*, centrado.
  - `isInsideSafeArea(rect: Rect): boolean` — bordes inclusivos.
- Produces (`SlideCanvas.vue`): prop `fontFamily?: string` (por defecto `DEFAULT_FONT_FAMILY`); slot por defecto; el elemento interno tiene la clase `slide-canvas`, mide 1920×1080, define `--slide-font-family` y se escala con `transform: translate(offsetX, offsetY) scale(scale)` y `transform-origin: 0 0`, recalculado con `ResizeObserver`. El contenedor externo ocupa el 100 % de su padre con `overflow: hidden`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// tests/unit/engine/canvas.test.ts
it.each([
  [960, 540, { scale: 0.5, offsetX: 0, offsetY: 0 }],
  [1920, 1200, { scale: 1, offsetX: 0, offsetY: 60 }],
  [1000, 1000, { scale: 1000 / 1920, offsetX: 0, offsetY: (1000 - 562.5) / 2 }],
])('computeScale(%i, %i)', (w, h, esperado) => {
  const r = computeScale(w, h)
  expect(r.scale).toBeCloseTo(esperado.scale, 6)
  expect(r.offsetX).toBeCloseTo(esperado.offsetX, 6)
  expect(r.offsetY).toBeCloseTo(esperado.offsetY, 6)
})
it.each([[0, 0], [0, 500], [-10, 300], [NaN, 400], [Infinity, 400]])(
  'contenedor inválido (%s, %s) → escala 0 sin NaN', (w, h) => {
    expect(computeScale(w, h)).toEqual({ scale: 0, offsetX: 0, offsetY: 0 })
})
it('área segura', () => {
  expect(SAFE_AREA).toEqual({ x: 96, y: 64, width: 1728, height: 952 })
  expect(isInsideSafeArea(SAFE_AREA)).toBe(true)
  expect(isInsideSafeArea({ x: 95, y: 64, width: 10, height: 10 })).toBe(false)
  expect(isInsideSafeArea({ x: 1814, y: 64, width: 10, height: 10 })).toBe(true)  // borde derecho 1824
  expect(isInsideSafeArea({ x: 1815, y: 64, width: 10, height: 10 })).toBe(false)
  expect(isInsideSafeArea({ x: 96, y: 1007, width: 10, height: 10 })).toBe(false) // borde inferior 1016
})
```

```ts
// tests/browser/engine/SlideCanvas.test.ts — montar en un host de tamaño fijo, attachTo: document.body
it('se escala a 960×540 dentro de un host de 960×540', async () => { /* rect de .slide-canvas: 960×540, top/left 0 (±0.5) */ })
it('se centra verticalmente en un host de 1000×1000', async () => { /* rect: ancho 1000, alto 562.5, top 218.75 (±0.5) */ })
it('reacciona al cambio de tamaño del host', async () => { /* cambiar el host a 480×270 → ancho 480 tras un frame */ })
it('expone la familia de fuente como variable CSS', () => { /* --slide-font-family contiene "Atkinson Hyperlegible" */ })
```

- [ ] **Step 2: Ejecutar para verlas fallar** — Run: `npm test -- canvas SlideCanvas` · Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar** `types.ts` (solo `Rect` por ahora), `canvas.ts` y `SlideCanvas.vue` según las interfaces. Desconectar el `ResizeObserver` en `onBeforeUnmount`.

- [ ] **Step 4: Ejecutar** — Run: `npm test -- canvas SlideCanvas` · Expected: PASS.

- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(motor): lienzo 1920×1080 escalado y área segura [C-06, §5.1]`

---

### Task 4: Color y contraste WCAG

**Files:**
- Create: `src/slides/engine/color.ts`
- Test: `tests/unit/engine/color.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Produces:
  - `type Rgb = { r: number; g: number; b: number }` (0–255)
  - `class InvalidColorError extends Error`
  - `parseColor(input: string): Rgb` — acepta `#rgb`, `#rrggbb` (sin distinguir mayúsculas), `rgb(r, g, b)` y `rgba(r, g, b, a)` (ignora `a`); cualquier otra cosa lanza `InvalidColorError`.
  - `toHex(c: Rgb): string` → `#rrggbb` en minúsculas.
  - `relativeLuminance(c: Rgb | string): number` — WCAG 2.x, umbral sRGB 0.04045.
  - `contrastRatio(a: Rgb | string, b: Rgb | string): number`
  - `minContrastAgainst(color: string, backgrounds: readonly string[]): number`
  - `TEXT_LIGHT = '#ffffff'`, `TEXT_DARK = '#000000'`
  - `pickTextColor(background: string | readonly string[]): { color: string; ratio: number }` — de `TEXT_LIGHT`/`TEXT_DARK`, el que tenga mayor contraste **mínimo** contra todas las paradas; empate → `TEXT_LIGHT`.
  - `ensureContrast(background: string, min?: number): { background: string; text: string; ratio: number; adjusted: boolean }` — `min` por defecto 7 (lo importa de `readability.ts` en la Tarea 5; aquí usar el literal y reemplazarlo allí).

**Algoritmo de `ensureContrast`** (determinista): si `pickTextColor(bg).ratio ≥ min`, devolver sin cambios. Si no, pasar el fondo a HSL y calcular dos candidatos manteniendo H y S: (a) **oscurecer** con texto blanco: la mayor L' ≤ L con contraste ≥ min; (b) **aclarar** con texto negro: la menor L' ≥ L con contraste ≥ min. Buscar cada L' por bisección (30 iteraciones) y, tras `toHex`, si el redondeo dejó el contraste por debajo de `min`, mover L' 0.5 puntos más y repetir. Elegir el candidato con menor |ΔL|; empate → oscurecer.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
it('luminancia y contrastes de referencia', () => {
  expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 6)
  expect(relativeLuminance('#000000')).toBeCloseTo(0, 6)
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
  expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  expect(contrastRatio('#0b1f3a', '#ffffff')).toBeGreaterThan(15)
  expect(contrastRatio('#123456', '#abcdef')).toBeCloseTo(contrastRatio('#abcdef', '#123456'), 10)
})
it('parseColor', () => {
  expect(parseColor('#ABC')).toEqual({ r: 170, g: 187, b: 204 })
  expect(parseColor('#0b1F3a')).toEqual({ r: 11, g: 31, b: 58 })
  expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30 })
  expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual({ r: 10, g: 20, b: 30 })
  for (const malo of ['', 'abc', '#12345', '#ggg', 'red', 'rgb(300, 0, 0)']) {
    expect(() => parseColor(malo)).toThrow(InvalidColorError)
  }
})
it('pickTextColor', () => {
  expect(pickTextColor('#0b1f3a').color).toBe('#ffffff')
  expect(pickTextColor('#fff59d').color).toBe('#000000')
  const deg = pickTextColor(['#0b1f3a', '#1e3a8a'])
  expect(deg.color).toBe('#ffffff')
  expect(deg.ratio).toBeCloseTo(minContrastAgainst('#ffffff', ['#0b1f3a', '#1e3a8a']), 6)
})
it('amarillo claro personalizado → texto ≥ 7:1 sin ajustar (criterio §10.9)', () => {
  const r = ensureContrast('#fff59d')
  expect(r).toMatchObject({ background: '#fff59d', text: '#000000', adjusted: false })
  expect(r.ratio).toBeGreaterThanOrEqual(7)
})
it('gris medio: ni blanco ni negro llegan a 7:1 → ajusta el fondo', () => {
  const r = ensureContrast('#777777')
  expect(r.adjusted).toBe(true)
  expect(contrastRatio(r.text, r.background)).toBeGreaterThanOrEqual(7)
})
const MUESTRA = ['#ff0000', '#00ff00', '#0000ff', '#ff9800', '#9c27b0', '#808080',
                 '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#3f51b5', '#795548']
it.each(MUESTRA)('ensureContrast(%s) siempre ≥ 7:1 y determinista', (c) => {
  const a = ensureContrast(c), b = ensureContrast(c)
  expect(a).toEqual(b)
  expect(contrastRatio(a.text, a.background)).toBeGreaterThanOrEqual(7)
  expect(a.ratio).toBeCloseTo(contrastRatio(a.text, a.background), 6)
})
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `npm run test:unit -- color` · FAIL.
- [ ] **Step 3: Implementar `color.ts`** según las interfaces y el algoritmo.
- [ ] **Step 4: Ejecutar** — `npm run test:unit -- color` · PASS.
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(motor): contraste WCAG 2.x y ajuste de fondo a 7:1 [RNF-02, RF-32, §5.5]`

---

### Task 5: Reglas de legibilidad (§5.2–§5.4)

**Files:**
- Create: `src/slides/engine/readability.ts`
- Modify: `src/slides/engine/types.ts`, `src/slides/engine/color.ts` (usar `MIN_CONTRAST`), `HANDOFF.md`
- Test: `tests/unit/engine/readability.test.ts`

**Interfaces:**
- Consumes: `Rect`, `isInsideSafeArea` (Tarea 3).
- Produces (`types.ts`):

```ts
export type TextRole = 'title' | 'key' | 'secondary' | 'birthdayNameSingle' | 'birthdayNameGroup' | 'meta'
export interface TextSlotDef {
  id: string
  role: TextRole
  box: Rect                 // en px del lienzo
  fieldKey?: string         // campo del formulario que alimenta el slot (para señalar "No cabe")
  minFontSize?: number      // nunca menor que el mínimo del rol
  maxFontSize?: number      // por defecto, el preferido máximo del rol
  maxLines?: number
  uppercase?: boolean       // solo permitido con maxLines === 1
  align?: 'left' | 'center' | 'right'
}
```

- Produces (`readability.ts`):
  - `MIN_CONTRAST = 7`, `LOGO_MIN_CONTRAST = 3`, `LINE_HEIGHT = 1.2`, `MAX_INFO_LINES = 6`, `MAX_RUNNING_WORDS = 40`, `ICON_MIN_PX = 64`, `LOGO_HEIGHT = { min: 90, max: 160, coverMax: 400 }`
  - `TEXT_ROLES: Record<TextRole, { min: number; preferredMin: number; preferredMax: number; weight: 400 | 700 }>` con los valores de Global Constraints (`title` 96/120/150/700, `key` 68/80/96/700, `secondary` 52/60/64/400, `birthdayNameSingle` 120/160/260/700, `birthdayNameGroup` 60/72/96/700, `meta` 36/40/40/400).
  - `class ReadabilityViolation extends Error { code: 'font_below_min' | 'invalid_range' | 'outside_safe_area' | 'uppercase_multiline' }`
  - `resolveFontRange(slot: TextSlotDef): { min: number; max: number }` — `min = max(TEXT_ROLES[role].min, slot.minFontSize ?? 0)`; `max = slot.maxFontSize ?? preferredMax`. Nunca devuelve un `min` por debajo del rol.
  - `validateTextSlot(slot: TextSlotDef): void` — lanza `ReadabilityViolation` si `slot.minFontSize` < mínimo del rol, si `max < min`, si `box` sale del área segura, o si `uppercase` y `maxLines !== 1`. (Lo usará el registro de plantillas en P3.)
  - `countWords(text: string): number` — separa por espacios en blanco y descarta los vacíos.
  - `checkDensity(input: { infoLines: number; runningText: readonly string[] }): { code: 'too_many_lines' | 'too_many_words'; actual: number; limit: number }[]`

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
const slot = (p: Partial<TextSlotDef> = {}): TextSlotDef =>
  ({ id: 't', role: 'title', box: { x: 96, y: 64, width: 1728, height: 300 }, ...p })

it('tabla de roles igual a §5.3', () => {
  expect(TEXT_ROLES.title).toEqual({ min: 96, preferredMin: 120, preferredMax: 150, weight: 700 })
  expect(TEXT_ROLES.key.min).toBe(68)
  expect(TEXT_ROLES.secondary).toMatchObject({ min: 52, weight: 400 })
  expect(TEXT_ROLES.birthdayNameSingle).toMatchObject({ min: 120, preferredMax: 260 })
  expect(TEXT_ROLES.birthdayNameGroup.min).toBe(60)
  expect(TEXT_ROLES.meta.min).toBe(36)
})
it('resolveFontRange nunca baja del mínimo del rol', () => {
  expect(resolveFontRange(slot())).toEqual({ min: 96, max: 150 })
  expect(resolveFontRange(slot({ minFontSize: 50 }))).toEqual({ min: 96, max: 150 })
  expect(resolveFontRange(slot({ minFontSize: 110, maxFontSize: 140 }))).toEqual({ min: 110, max: 140 })
})
it.each([
  [{ minFontSize: 80 }, 'font_below_min'],
  [{ maxFontSize: 90 }, 'invalid_range'],
  [{ box: { x: 0, y: 64, width: 500, height: 200 } }, 'outside_safe_area'],
  [{ uppercase: true }, 'uppercase_multiline'],
  [{ uppercase: true, maxLines: 2 }, 'uppercase_multiline'],
])('validateTextSlot(%o) → %s', (p, code) => {
  expect(() => validateTextSlot(slot(p))).toThrow(expect.objectContaining({ code }))
})
it('un slot correcto en mayúsculas de una línea es válido', () => {
  expect(() => validateTextSlot(slot({ uppercase: true, maxLines: 1 }))).not.toThrow()
})
it('densidad §5.4', () => {
  expect(countWords('  Culto   de\njóvenes ')).toBe(3)
  expect(checkDensity({ infoLines: 6, runningText: ['uno dos'] })).toEqual([])
  expect(checkDensity({ infoLines: 7, runningText: [] }))
    .toEqual([{ code: 'too_many_lines', actual: 7, limit: 6 }])
  const largo = Array.from({ length: 41 }, () => 'palabra').join(' ')
  expect(checkDensity({ infoLines: 1, runningText: [largo] }))
    .toEqual([{ code: 'too_many_words', actual: 41, limit: 40 }])
})
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `npm run test:unit -- readability` · FAIL.
- [ ] **Step 3: Implementar** `readability.ts`, ampliar `types.ts` y hacer que `ensureContrast` use `MIN_CONTRAST` por defecto.
- [ ] **Step 4: Ejecutar** — `npm run test:unit` · PASS (incluidas las de color).
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(motor): reglas de legibilidad §5.2–§5.4 [C-04, RNF-02]`

---

### Task 6: Búsqueda binaria del tamaño de fuente

**Files:**
- Create: `src/slides/engine/fit.ts`
- Test: `tests/unit/engine/fit.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Produces:
  - `type FitProbe = (fontSize: number) => boolean` — se supone monótona (si cabe a N, cabe a N−1).
  - `findLargestFittingSize(range: { min: number; max: number }, fits: FitProbe): number | null` — mayor entero en `[min, max]` que cabe; `null` si no cabe ni con `min`. Prueba `min` primero; luego bisección con punto medio hacia arriba. Lanza `RangeError` si `min > max` o si algún extremo no es entero positivo.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
const contar = (limite: number) => { let n = 0; return { fits: (s: number) => (n++, s <= limite), calls: () => n } }
it('encuentra el mayor tamaño que cabe', () => {
  expect(findLargestFittingSize({ min: 96, max: 150 }, s => s <= 117)).toBe(117)
})
it('todo cabe → max; solo cabe min → min; nada cabe → null', () => {
  expect(findLargestFittingSize({ min: 96, max: 150 }, () => true)).toBe(150)
  expect(findLargestFittingSize({ min: 96, max: 150 }, s => s === 96)).toBe(96)
  expect(findLargestFittingSize({ min: 96, max: 150 }, () => false)).toBeNull()
})
it('min === max', () => {
  expect(findLargestFittingSize({ min: 40, max: 40 }, () => true)).toBe(40)
})
it('pocas mediciones (≤ 8 para 96–150)', () => {
  const p = contar(101)
  findLargestFittingSize({ min: 96, max: 150 }, p.fits)
  expect(p.calls()).toBeLessThanOrEqual(8)
})
it('rangos inválidos', () => {
  expect(() => findLargestFittingSize({ min: 150, max: 96 }, () => true)).toThrow(RangeError)
  expect(() => findLargestFittingSize({ min: 0, max: 96 }, () => true)).toThrow(RangeError)
  expect(() => findLargestFittingSize({ min: 96.5, max: 150 }, () => true)).toThrow(RangeError)
})
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `npm run test:unit -- fit` · FAIL.
- [ ] **Step 3: Implementar `fit.ts`.**
- [ ] **Step 4: Ejecutar** — `npm run test:unit -- fit` · PASS.
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(motor): búsqueda binaria del tamaño de fuente [§5.6]`

---

### Task 7: Medición en el DOM (`measureTextFit`)

**Files:**
- Create: `src/slides/engine/measure.ts`
- Modify: `src/slides/engine/types.ts`, `HANDOFF.md`
- Test: `tests/browser/engine/measure.test.ts`

**Interfaces:**
- Consumes: `TextSlotDef`, `TEXT_ROLES`, `LINE_HEIGHT`, `resolveFontRange` (Tarea 5); `findLargestFittingSize` (Tarea 6).
- Produces (`types.ts`):

```ts
export type FitResult =
  | { status: 'fits'; fontSize: number; lines: number; belowPreferred: boolean }
  | { status: 'too_long'; minFontSize: number }
  | { status: 'empty' }
```

- Produces (`measure.ts`):
  - `class FontNotLoadedError extends Error`
  - `ensureFontLoaded(family: string, weights?: readonly (400 | 700)[]): Promise<void>` — por defecto `[400, 700]`; usa `document.fonts.load(\`${w} 100px "${family}"\`)` y lanza `FontNotLoadedError` si alguna devuelve una lista vacía. Registra `family|weight` en un `Set` del módulo.
  - `normalizeSlotText(text: string): string` — `trim`; colapsa espacios y tabulaciones; conserva los `\n` (máximo uno seguido).
  - `measureTextFit(text: string, slot: TextSlotDef, opts: { fontFamily: string }): FitResult` — síncrona. Lanza `FontNotLoadedError` si `family|peso del rol` no pasó por `ensureFontLoaded` (**nunca mide con la fuente de respaldo**). Texto normalizado vacío → `{ status: 'empty' }`.

**Medición:** un único host oculto (`div[data-measure-host]`, `position: fixed; left: -20000px; top: 0; visibility: hidden; contain: layout`) agregado a `document.body` una vez. Dentro, un elemento con `width: box.width px; height: auto; overflow: hidden; white-space: pre-line; overflow-wrap: normal; word-break: normal; hyphens: manual; line-height: LINE_HEIGHT; font-family: "<family>"; font-weight: <peso del rol>; text-transform: <uppercase? 'uppercase' : 'none'>`. El sondeo para un tamaño `s` cabe si `scrollWidth ≤ box.width`, `alto ≤ box.height` y, si hay `maxLines`, `round(alto / (s × LINE_HEIGHT)) ≤ maxLines`. `belowPreferred = fontSize < TEXT_ROLES[role].preferredMin`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
const F = 'Atkinson Hyperlegible'
beforeAll(() => ensureFontLoaded(F))
const titulo: TextSlotDef = { id: 'titulo', role: 'title', fieldKey: 'titulo', box: { x: 96, y: 64, width: 1728, height: 400 } }

it('un título corto cabe al tamaño máximo en una línea', () => {
  expect(measureTextFit('Culto de Jóvenes', titulo, { fontFamily: F }))
    .toEqual({ status: 'fits', fontSize: 150, lines: 1, belowPreferred: false })
})
it('un título de 60 palabras no cabe y reporta el mínimo', () => {
  const largo = Array.from({ length: 60 }, (_, i) => `palabra${i}`).join(' ')
  expect(measureTextFit(largo, titulo, { fontFamily: F })).toEqual({ status: 'too_long', minFontSize: 96 })
})
it.each(['Otorrinolaringología', '809-555-1234'])('palabra sin cortes "%s" en slot estrecho', (txt) => {
  const estrecho: TextSlotDef = { id: 's', role: 'secondary', box: { x: 96, y: 64, width: 420, height: 400 } }
  const r = measureTextFit(txt, estrecho, { fontFamily: F })
  if (r.status === 'fits') { expect(r.lines).toBe(1); expect(r.fontSize).toBeGreaterThanOrEqual(52) }
  else expect(r).toEqual({ status: 'too_long', minFontSize: 52 })
})
it('maxLines: 1 reduce el tamaño en lugar de partir en dos líneas', () => {
  // a 150 px no entra en 1728 de ancho en una línea; a 96 px sí
  const unaLinea: TextSlotDef = { ...titulo, maxLines: 1 }
  const r = measureTextFit('Campamento de Conquistadores', unaLinea, { fontFamily: F })
  expect(r.status).toBe('fits')
  if (r.status === 'fits') { expect(r.lines).toBe(1); expect(r.fontSize).toBeLessThan(150) }
})
it('las mayúsculas ocupan más: el tamaño resultante es menor que sin ellas', () => {
  const base: TextSlotDef = { ...titulo, box: { ...titulo.box, width: 1400 }, maxLines: 1 }
  const normal = measureTextFit('Gran Culto Especial', base, { fontFamily: F })
  const mayus = measureTextFit('Gran Culto Especial', { ...base, uppercase: true }, { fontFamily: F })
  expect(normal.status).toBe('fits'); expect(mayus.status).not.toBe('empty')
  if (normal.status === 'fits' && mayus.status === 'fits') expect(mayus.fontSize).toBeLessThan(normal.fontSize)
})
it('respeta los saltos de línea del usuario', () => {
  const r = measureTextFit('Línea uno\nLínea dos', { ...titulo, role: 'secondary' }, { fontFamily: F })
  expect(r.status === 'fits' && r.lines >= 2).toBe(true)
})
it.each(['', '   ', '\n\t '])('texto vacío %j → empty', (t) => {
  expect(measureTextFit(t, titulo, { fontFamily: F })).toEqual({ status: 'empty' })
})
it('determinista', () => {
  expect(measureTextFit('Salida a la playa', titulo, { fontFamily: F }))
    .toEqual(measureTextFit('Salida a la playa', titulo, { fontFamily: F }))
})
it('fuente inexistente: ensureFontLoaded rechaza y measureTextFit no mide', async () => {
  await expect(ensureFontLoaded('NoExiste')).rejects.toBeInstanceOf(FontNotLoadedError)
  expect(() => measureTextFit('Hola', titulo, { fontFamily: 'NoExiste' })).toThrow(FontNotLoadedError)
})
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `npm run test:browser -- measure` · FAIL.
- [ ] **Step 3: Implementar `measure.ts`** según las interfaces y la medición descrita.
- [ ] **Step 4: Ejecutar** — `npm run test:browser -- measure` · PASS. Si el caso "las mayúsculas ocupan más" resulta frágil con la fuente real, cambiar el texto, no el criterio.
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(motor): ajuste de texto medido en el DOM sin bajar del mínimo [C-04, §5.6]`

---

### Task 8: `FitText.vue` y estado "No cabe"

**Files:**
- Create: `src/slides/engine/FitText.vue`, `src/slides/engine/fitReport.ts`
- Modify: `src/slides/engine/types.ts`, `HANDOFF.md`
- Test: `tests/unit/engine/fitReport.test.ts`, `tests/browser/engine/FitText.test.ts`

**Interfaces:**
- Consumes: `measureTextFit`, `ensureFontLoaded`, `normalizeSlotText` (Tarea 7); `TEXT_ROLES`, `LINE_HEIGHT` (Tarea 5).
- Produces (`types.ts`): `interface FitReport { slotId: string; fieldKey?: string; result: FitResult }`.
- Produces (`fitReport.ts`): `summarizeFit(reports: readonly FitReport[]): { status: 'ok' | 'no_cabe'; offendingSlots: string[]; offendingFields: string[] }` — `no_cabe` si algún `result.status === 'too_long'`; `empty` no cuenta; listas sin duplicados y en el orden de entrada.
- Produces (`FitText.vue`): props `{ slot: TextSlotDef; text: string; fontFamily?: string }` (por defecto `DEFAULT_FONT_FAMILY`); emite `fit: [report: FitReport]` tras cada medición (al montar y cuando cambian `text`, `slot` o `fontFamily`, después de `ensureFontLoaded`). Renderiza un `div` absoluto en `slot.box` con `data-role`, `data-slot-id`, `data-fit` (`'fits' | 'too_long'`), el tamaño medido, el peso del rol, `line-height: 1.2`, `text-align` y `text-transform`, y el texto normalizado con `white-space: pre-line`. Con `too_long` renderiza a `minFontSize` con `overflow: hidden` (la vista previa muestra el problema; **nunca** baja del mínimo). Con `empty` **no renderiza nada** (`v-if`).

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// unit
it('summarizeFit', () => {
  const ok = { slotId: 'a', fieldKey: 'titulo', result: { status: 'fits', fontSize: 120, lines: 1, belowPreferred: false } } as const
  const vacio = { slotId: 'b', fieldKey: 'lugar', result: { status: 'empty' } } as const
  const largo = { slotId: 'c', fieldKey: 'descripcion', result: { status: 'too_long', minFontSize: 52 } } as const
  expect(summarizeFit([ok, vacio])).toEqual({ status: 'ok', offendingSlots: [], offendingFields: [] })
  expect(summarizeFit([ok, largo, largo])).toEqual({ status: 'no_cabe', offendingSlots: ['c'], offendingFields: ['descripcion'] })
})
// browser (montado dentro de SlideCanvas)
it('texto largo → emite too_long y se dibuja exactamente al mínimo', async () => { /* font-size computado === '96px', data-fit="too_long" */ })
it('texto vacío → emite empty y no deja ningún elemento', async () => { /* querySelector('[data-slot-id="titulo"]') === null */ })
it('al cambiar el texto vuelve a medir y emite de nuevo', async () => { /* setProps({ text }) → 2.º evento con status fits */ })
it('peso según el rol: título 700, secundario 400', async () => { /* getComputedStyle(el).fontWeight */ })
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `npm test -- fitReport FitText` · FAIL.
- [ ] **Step 3: Implementar** `fitReport.ts` y `FitText.vue`.
- [ ] **Step 4: Ejecutar** — `npm test -- fitReport FitText` · PASS.
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(motor): FitText y estado "No cabe" [RF-10, §5.6, RNF-10]`

---

### Task 9: Selección de variante de logo

**Files:**
- Create: `src/slides/engine/logo.ts`
- Test: `tests/unit/engine/logo.test.ts`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: `minContrastAgainst`, `pickTextColor`, `contrastRatio` (Tarea 4); `LOGO_MIN_CONTRAST`, `LOGO_HEIGHT` (Tarea 5).
- Produces:

```ts
export type LogoOrientation = 'horizontal' | 'vertical' | 'cuadrado'
export type LogoCandidate = { id: string; orientation: LogoOrientation } & (
  | { color: 'blanco' } | { color: 'negro' } | { color: 'color'; dominantColor: string })
export interface LogoChoice { candidate: LogoCandidate; plate: string | null; contrast: number }
export function selectLogoVariant(candidates: readonly LogoCandidate[], background: string | readonly string[],
  opts?: { orientation?: LogoOrientation }): LogoChoice | null
export function clampLogoHeight(height: number, opts?: { cover?: boolean }): number
```

**Reglas** (RF-37, §5.5): (1) sin candidatos → `null` (la plantilla no deja hueco). (2) Si se pide `orientation` y hay candidatos con ella, solo se consideran esos; si no, todos. (3) Color representativo: `blanco` → `#ffffff`, `negro` → `#000000`, `color` → `dominantColor`; contraste = `minContrastAgainst` con todas las paradas del fondo. (4) Orden de preferencia: fondo oscuro (`pickTextColor(fondo).color === '#ffffff'`) → `blanco, color, negro`; fondo claro → `color, negro, blanco`. (5) El primero en ese orden con contraste ≥ 3 gana, sin placa. (6) Si ninguno llega: el de mayor contraste (empates por el orden de preferencia) sobre una **placa** `#ffffff` o `#000000`, la que más contraste con su color representativo; `contrast` se mide contra la placa. `clampLogoHeight`: normal [90, 160]; portada [90, 400].

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
const blanco = { id: 'b', color: 'blanco', orientation: 'horizontal' } as const
const negro = { id: 'n', color: 'negro', orientation: 'horizontal' } as const
const rojo = { id: 'c', color: 'color', dominantColor: '#c62828', orientation: 'horizontal' } as const
const amarillo = { id: 'y', color: 'color', dominantColor: '#ffeb3b', orientation: 'horizontal' } as const
const blancoV = { id: 'bv', color: 'blanco', orientation: 'vertical' } as const

it('fondo oscuro → blanco sin placa', () => {
  expect(selectLogoVariant([rojo, negro, blanco], '#0b1f3a')).toMatchObject({ candidate: { id: 'b' }, plate: null })
})
it('fondo claro → a color si contrasta ≥ 3', () => {
  expect(selectLogoVariant([blanco, negro, rojo], '#ffffff')).toMatchObject({ candidate: { id: 'c' }, plate: null })
})
it('fondo claro con logo a color poco visible → negro', () => {
  expect(selectLogoVariant([amarillo, negro], '#ffffff')).toMatchObject({ candidate: { id: 'n' }, plate: null })
})
it('sin variante adecuada → mejor disponible sobre placa', () => {
  const r = selectLogoVariant([blanco], '#ffffff')!
  expect(r).toMatchObject({ candidate: { id: 'b' }, plate: '#000000' })
  expect(r.contrast).toBeGreaterThanOrEqual(3)
})
it('orientación pedida si existe; si no, cualquiera', () => {
  expect(selectLogoVariant([blanco, blancoV], '#0b1f3a', { orientation: 'vertical' })!.candidate.id).toBe('bv')
  expect(selectLogoVariant([blanco], '#0b1f3a', { orientation: 'vertical' })!.candidate.id).toBe('b')
})
it('degradado: se mide contra la peor parada', () => {
  const r = selectLogoVariant([blanco, negro], ['#0b1f3a', '#f5f5f5'])!
  expect(r.plate).not.toBeNull()
})
it('sin logos → null', () => { expect(selectLogoVariant([], '#000000')).toBeNull() })
it('clampLogoHeight', () => {
  expect(clampLogoHeight(50)).toBe(90)
  expect(clampLogoHeight(200)).toBe(160)
  expect(clampLogoHeight(120)).toBe(120)
  expect(clampLogoHeight(300, { cover: true })).toBe(300)
  expect(clampLogoHeight(900, { cover: true })).toBe(400)
})
```

- [ ] **Step 2: Ejecutar para verlas fallar** — `npm run test:unit -- logo` · FAIL.
- [ ] **Step 3: Implementar `logo.ts`.**
- [ ] **Step 4: Ejecutar** — `npm run test:unit -- logo` · PASS.
- [ ] **Step 5: Actualizar HANDOFF.md y hacer commit** — `feat(motor): selección de variante de logo con placa de contraste [RF-37, RF-38, RF-39]`

---

### Task 10: Auditoría de slides, API del motor y verificación final

**Files:**
- Create: `src/slides/engine/audit.ts`, `src/slides/engine/index.ts`
- Test: `tests/browser/engine/audit.test.ts`
- Modify: `HANDOFF.md`, `docs/superpowers/plans/2026-11-01-fase1-hoja-de-ruta.md` (marcar P1 como hecho)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces (`audit.ts`): `interface AuditViolation { code: 'font_below_min' | 'outside_safe_area' | 'low_contrast' | 'text_overflow' | 'logo_size' | 'icon_size'; element: Element; detail: string }` y `auditSlide(canvasEl: HTMLElement): AuditViolation[]`, donde `canvasEl` es el `.slide-canvas`.

**Contrato de marcado** (lo deben cumplir las plantillas de P3): texto informativo con `data-role="<TextRole>"`; logos con `data-logo` (y `data-cover` en la portada); íconos de datos clave con `data-icon`; contenedores con degradado con `data-bg="#hex,#hex,…"`.

**Reglas:** escala = `canvasEl.getBoundingClientRect().width / 1920`; las cajas se pasan a px del lienzo restando el origen del lienzo y dividiendo por la escala. Para cada `[data-role]`: `font-size` computado ≥ mínimo del rol (`font_below_min`); caja dentro de `SAFE_AREA` (`outside_safe_area`); `data-fit="too_long"` → `text_overflow`; contraste del `color` computado contra el fondo efectivo ≥ 7 (`low_contrast`). Fondo efectivo: el ancestro más cercano (incluido el propio elemento) con `data-bg` (todas sus paradas) o con `background-color` no transparente; si no hay ninguno, `#ffffff`. Para `[data-logo]`: dentro del área segura y alto entre 90 y 160 (400 con `data-cover`) → `logo_size`. Para `[data-icon]`: ancho y alto ≥ 64 → `icon_size`.

- [ ] **Step 1: Escribir las pruebas que fallan** (fixtures montados en `SlideCanvas` dentro de un host de 960×540, para probar también la escala)

```ts
it('slide conforme → sin violaciones', () => { /* título 120px blanco sobre #0b1f3a, dato clave 80px, logo de 120px, ícono de 64px, todo dentro del área segura */ expect(auditSlide(c)).toEqual([]) })
it('título a 90px → font_below_min', () => { /* … */ })
it('elemento en x = 50 → outside_safe_area', () => { /* … */ })
it('gris sobre gris → low_contrast', () => { /* color #777 sobre #999 */ })
it('degradado con una parada mala → low_contrast', () => { /* data-bg="#0b1f3a,#cfd8dc", texto blanco */ })
it('data-fit="too_long" → text_overflow', () => { /* … */ })
it('logo de 200px → logo_size; con data-cover es válido', () => { /* … */ })
it('ícono de 48px → icon_size', () => { /* … */ })
it('con FitText real y texto imposible → text_overflow pero nunca font_below_min', () => { /* integra Tareas 8 y 10 */ })
```

Cada prueba afirma exactamente los `code` esperados, por ejemplo `expect(auditSlide(c).map(v => v.code)).toEqual(['font_below_min'])`.

- [ ] **Step 2: Ejecutar para verlas fallar** — `npm run test:browser -- audit` · FAIL.
- [ ] **Step 3: Implementar `audit.ts`** y `index.ts` (reexporta la API pública: `canvas`, `color`, `readability`, `fit`, `measure`, `fitReport`, `logo`, `audit`, los tipos, `SlideCanvas` y `FitText`).
- [ ] **Step 4: Verificación completa**

Run: `npm run typecheck && npm test && npm run test:e2e && npm run build`
Expected: 0 errores de tipos; todas las pruebas `unit`, `browser` y E2E en verde; build sin avisos de dependencias externas.

- [ ] **Step 5: Actualizar HANDOFF.md** (P1 terminado, resumen de la API del motor, próximo paso = escribir el plan de P2) **y la hoja de ruta; hacer commit**

```bash
git add -A
git commit -m "feat(motor): auditoría de slides §5.7 y API pública del motor [RNF-02, §5.7]"
```
