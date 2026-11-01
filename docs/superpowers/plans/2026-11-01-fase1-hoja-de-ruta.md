# Fase 1 (pasos 1–7, solo local): hoja de ruta

> Documento índice. Cada bloque (P1…P6) tiene o tendrá su propio plan detallado en `docs/superpowers/plans/`. Solo **P1** está detallado ahora; los demás se detallan al empezarlos, porque dependen de las interfaces reales del motor.

**Spec:** `SRS.md` (v1.3). **Alcance:** pasos 1–7 de §11, **sin backend** (Supabase, la vista de lectura y el despliegue quedan para los pasos 8–11).

**Regla transversal:** antes de cada tarea, leer `HANDOFF.md` si no está en el contexto; al terminarla, actualizarlo e incluirlo en el commit.

## Bloques

| Bloque | Pasos §11 | Entregable verificable | Requisitos | Plan |
|---|---|---|---|---|
| **P1 · Base y motor** ✅ (rama `fase1/p1-base-y-motor`) | 1–2 | Proyecto montado (PWA offline, fuente local, Vitest unit + browser, Playwright, `.htaccess`) y motor de legibilidad con pruebas: lienzo escalado, contraste, ajuste de texto, selección de logo, auditoría de slides. | C-03, C-04, C-06, RNF-01, RNF-02, RNF-05, RF-32 (parte de contraste), RF-37, RF-39, §5 | `2026-11-01-fase1-p1-base-y-motor.md` |
| **P2 · Tipos, datos locales y logos** | 3 | Definiciones declarativas de los 7 tipos MVP; esquema Zod generado desde `FieldDef`; formato es-DO de fecha/hora/moneda; Dexie (anuncios, ministerios, imágenes, presentaciones, temas, ajustes) con repositorios; ministerio "Iglesia" precargado con **logo de prueba** (SVG color/blanco/negro); color dominante de logos subidos; compresión de imágenes (RNF-04). | RF-01, RF-04, RF-09, RF-35, RF-36, RNF-04, RNF-08, §3.2, §7 | por escribir |
| **P3 · Plantillas y temas** | 4 | Contrato `TemplateDef`/`SlotDef`; temas predefinidos + tema neutro + `deriveTheme(primario)`; plantillas Clásica y Visual para cada tipo; cumpleaños individual (con/sin foto), grupo e híbrido con reparto "(1/2)"; slide de imagen con relleno difuminado; portada y cierre. Pruebas §5.7 con datos extremos usando `auditSlide` y capturas Playwright. | RF-20…RF-26, RF-30…RF-33, RF-37…RF-42, RF-53, C-07, §5.7, §9 | por escribir |
| **P4 · Formularios y vista previa** | 5 | App con rutas; Inicio; elegir tipo; formulario generado desde `FieldDef` con contadores de caracteres; vista previa en vivo; selectores de plantilla, tema y "Logo en la slide"; estado "No cabe" señalando el campo; notas del presentador; guardar borrador, duplicar, eliminar; lista con filtros y archivado de pasados; subida de flyers con aviso de baja resolución. | RF-01…RF-04, RF-06…RF-10, RF-42, RNF-03, RNF-04 (vista previa < 200 ms) | por escribir |
| **P5 · Presentaciones** | 6 | Crear presentación (próximo sábado), sugerir anuncios futuros, agregar/ordenar (arrastrar + botones), bloquear "No cabe", portada/cierre, miniaturas con conteo, "Preparar sin internet" con verificación local de datos, imágenes, logos, fuente y Service Worker. | RF-50…RF-55 | por escribir |
| **P6 · Presentar** | 7 | Vista del presentador + ventana pública (`/publica`) con `BroadcastChannel('presentacion')`; teclado/clicker; pantalla negra y de logo; reabrir la pública en la misma slide; modo de una sola ventana; fundido ≤ 300 ms; Window Management API como mejora opcional. E2E con dos páginas en Chromium, sin red. | RF-60…RF-68, RNF-04 (< 100 ms), criterios §10.1–3 | por escribir |

## Orden y dependencias

P1 → P2 → P3 → P4 → P5 → P6, en serie: cada bloque consume las interfaces del anterior (P3 usa el motor y los tipos; P4 usa las plantillas; P5 y P6 usan el render de slides y Dexie).

## Puntos a decidir más adelante (no bloquean P1)

- **§13.2-A:** archivos reales del logo de la iglesia. Se usan logos de prueba hasta recibirlos (P2).
- **RF-102** (`navigator.storage.persist()`): §11 lo pone en el paso 10, pero "Preparar sin internet" (P5) es más fiable con él. Se propondrá al llegar a P5.
- Tailwind para la interfaz de la app (opcional según §8.1): se decide en P4.

## Al terminar P6

Validación manual en la iglesia (laptop sin internet + pantallas, Chrome y Brave), según la recomendación de §11, antes de empezar los pasos 8–9.
