# Licencias

El código de este proyecto se publica bajo la licencia **MIT** (ver `LICENSE`).

Todas las dependencias, fuentes, logos y assets deben tener licencias compatibles (RNF-09). Cada dependencia nueva **de runtime** (lo que llega al navegador) se anota aquí.

## Fuentes

| Recurso | Licencia | Notas |
|---|---|---|
| Atkinson Hyperlegible (Braille Institute), vía `@fontsource/atkinson-hyperlegible` | SIL Open Font License 1.1 | Empaquetada localmente; nunca se carga desde Google Fonts. |
| Inter (Rasmus Andersson), vía `@fontsource-variable/inter` | SIL Open Font License 1.1 | Interfaz. Empaquetada localmente. |
| Instrument Serif (Instrument), vía `@fontsource/instrument-serif` | SIL Open Font License 1.1 | Títulos de la interfaz. Empaquetada localmente. |

## Logos

| Recurso | Licencia | Notas |
|---|---|---|
| Logo de la Iglesia Adventista del Séptimo Día (`src/assets/logos/iglesia/`) | Marca registrada de la Asociación General; **no** está cubierto por la licencia MIT | Se usa según las normas de identidad de la iglesia, provisto por el responsable. Quien reutilice este código debe sustituirlo o tener permiso de uso. |
| Logo general IASD (`src/assets/logos/iasd-general/`) y logos de ministerios IASD: Aventureros, Conquistadores, Escuela Sabática, Guías Mayores, Jóvenes Adventistas, Ministerio de la Mujer (`src/assets/logos/ministerios/`) | Marcas de la Asociación General; **no** están cubiertas por la licencia MIT | El responsable los proporcionó. Se vectorizaron a SVG (vtracer) y se les quitó el fondo. Se aplican las mismas condiciones que al logo de la iglesia. |

## Dependencias de runtime

| Paquete | Licencia |
|---|---|
| `vue` | MIT |
| `dexie` | Apache-2.0 |
| `zod` | MIT |
| `@lucide/vue` (íconos SVG, empaquetados) | ISC |
| `@fontsource/atkinson-hyperlegible` | MIT (paquete) / OFL-1.1 (fuente) |
| `vue-router` | MIT |
| `@fontsource-variable/inter` (Inter, interfaz) | MIT (paquete) / OFL-1.1 (fuente) |
| `@fontsource/instrument-serif` (Instrument Serif, títulos de la interfaz) | MIT (paquete) / OFL-1.1 (fuente) |
| `tailwindcss` (CSS generado en el build) | MIT |
| Workbox (incluido en `sw.js` por `vite-plugin-pwa`) | MIT |

## Herramientas de desarrollo (no se distribuyen)

Vite, `@vitejs/plugin-vue`, TypeScript, `vue-tsc`, Vitest, `@vitest/browser-playwright`, Playwright, `@vue/test-utils`: MIT o Apache-2.0.
