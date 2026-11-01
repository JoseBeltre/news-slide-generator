# Brief: rediseño visual de las slides

> Para la sesión dedicada al diseño de las slides (P3, antes de la Tarea 6). Léelo junto con `HANDOFF.md`, `SRS.md` §5 y §9 y el plan `docs/superpowers/plans/2026-11-01-fase1-p3-plantillas-y-temas.md`.

## Qué pasó

Las primeras 3 direcciones de la Tarea 5 (sobria, banda y cálida; capturas en `docs/slides-direcciones/`) cumplen §5, pero el responsable las rechazó (2026-11-01):

> "Todos están bien feos… cumplen los constraints, el texto se va a ver bien desde la pantalla, pero el anuncio es muy feo, plano… la disposición de las informaciones, muy fea, muy básica, muy de IA… no tiene corazón."

## Diagnóstico

1. **Todo pesa lo mismo.** Título a 150 px y datos a 96 px: casi no hay contraste de escala, así que se lee como un formulario.
2. **Sin composición.** Es una lista de filas alineada a la izquierda; el espacio vacío sobra, no está diseñado.
3. **Los chips con ícono son lenguaje de interfaz de app** (tableros, formularios), no de afiche. Es lo que más delata "hecho por IA".
4. **Fondos planos:** sin textura, sin capas, sin profundidad ni imagen.
5. **La fecha va como un dato más,** cuando en un anuncio de iglesia suele ser el elemento protagonista.
6. **Identidad por tipo débil:** solo cambia el color del acento.

## Qué puede cambiar

- **Escala:** dejar de dibujar en el tope del rango preferido. El título puede ser grande y el resto bastante menor, cerca del mínimo.
- **Mínimos de §5.3:** el responsable acepta bajarlos **un poco** ("podemos arriesgar un poco de visibilidad, no tanto"). Hay que proponer números concretos y confirmarlos con el responsable antes de cambiar el SRS y `TEXT_ROLES`.
- **Disposición:** composiciones asimétricas; la fecha en bloque ("SÁB / 7 / NOV"); información agrupada; layouts distintos según el tipo (por datos, sin código por tipo: RNF-08).
- **Riqueza visual:** capas, formas, texturas o patrones en SVG local y determinista; fotos con tratamiento (duotono, recortes), motivos por tipo; detalles festivos en cumpleaños.
- **Íconos:** opcionales o integrados con más gracia, no como chips de interfaz. §5.4 pide ícono ≥ 64 px por dato clave; si se quiere relajar, se confirma con el responsable.

## Qué no cambia

- Offline y determinista (C-01, C-03); una sola fuente local (Atkinson Hyperlegible, aunque se puede jugar con pesos y tamaños); 16:9; área segura.
- Contraste 7:1 en el texto (o el valor que se confirme), y **nunca texto sobre foto sin un fondo verificado**.
- "No cabe" en vez de letra por debajo del mínimo; las pruebas de `auditSlide`.
- El estilo de las slides **no depende** del DESIGN.md de la interfaz.

## Cómo trabajarlo

- Usar los skills de diseño: `impeccable` (diseño con dirección y crítica), `ui-ux-pro-max` y sus `slides`, y `ecc:frontend-slides` ("mostrar, no describir").
- Buscar referencias reales de anuncios de iglesia bien diseñados (afiches, pantallas de bienvenida, redes de iglesias) para aprender composición, no para copiar.
- Iterar en la galería (`pnpm dev` → `/galeria.html?only=<id>`; `window.auditSlide()` lista las violaciones de §5) con capturas a 1920×1080. Probar siempre con datos extremos: todos los opcionales llenos, título largo, sin logo, tema claro y oscuro.
- Presentar 3 direcciones nuevas al responsable, cada una con su fundamento, y que él elija. Después, la Tarea 6 (Clásica) en adelante sigue con la dirección elegida.

## Código existente que se reutiliza o se reemplaza

- Se queda: `normalize.ts`, `themes.ts`, `contract.ts`, `registry.ts`, `SlideView.vue`, `LogoSlot.vue`, `SlideText.vue`, `SlideBackground.vue`, galería y capturas.
- Se rehace libremente: `classic/layout.ts`, `ClassicSlide.vue`, `parts/IconChip.vue`, `parts/EdgeDecoration.vue`, `parts/decoration.ts` y `cover/CoverSlide.vue`.
