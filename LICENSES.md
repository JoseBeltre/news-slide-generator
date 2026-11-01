# Licencias

El código de este proyecto se publica bajo la licencia **MIT** (ver `LICENSE`).

Todas las dependencias, fuentes, logos y assets deben tener licencias compatibles (RNF-09). Cada dependencia nueva **de runtime** (lo que llega al navegador) se anota aquí.

## Fuentes

| Recurso | Licencia | Notas |
|---|---|---|
| Atkinson Hyperlegible (Braille Institute), vía `@fontsource/atkinson-hyperlegible` | SIL Open Font License 1.1 | Empaquetada localmente; nunca se carga desde Google Fonts. |

## Dependencias de runtime

| Paquete | Licencia |
|---|---|
| `vue` | MIT |
| `dexie` | Apache-2.0 |
| `@fontsource/atkinson-hyperlegible` | MIT (paquete) / OFL-1.1 (fuente) |
| Workbox (incluido en `sw.js` por `vite-plugin-pwa`) | MIT |

## Herramientas de desarrollo (no se distribuyen)

Vite, `@vitejs/plugin-vue`, TypeScript, `vue-tsc`, Vitest, `@vitest/browser-playwright`, Playwright, `@vue/test-utils`: MIT o Apache-2.0.
