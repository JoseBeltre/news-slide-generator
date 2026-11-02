# Product

<!-- impeccable:product-schema 1 -->

> Resumen de producto para los skills de diseño. La fuente de verdad es `SRS.md`; si algo aquí la contradice, manda el SRS.

## Platform

web

## Users

- **Equipo de anuncios** de la Iglesia Adventista del Séptimo Día Mansedumbre II (República Dominicana): jóvenes y adultos que manejan bien la tecnología, sin formación de diseño, que preparan los anuncios de la semana desde el celular o la laptop (Windows con Chrome o Brave). Para ellos es **la interfaz**: rápida, clara y eficiente, sin tratarlos como principiantes.
- **La congregación**: lee las slides proyectadas cada sábado desde los bancos, a ~12–15 m de la pantalla; incluye personas mayores y con baja visión. Para ellos son **las slides** (§5); nunca usan la interfaz.

## Product Purpose

App web offline que convierte datos de un anuncio (tipo, título, fecha, hora, lugar, precio, contacto, foto, logo de ministerio) en slides 16:9 legibles y bonitas, sin que el equipo tenga que diseñar. Éxito: el sábado la congregación encuentra la fecha y el lugar de cada anuncio en menos de 2 segundos, y las slides se sienten hechas con cariño, no por una máquina.

## Positioning

El diseño y la legibilidad los impone el motor (C-04): el usuario solo llena datos y elige tema; la plantilla garantiza tamaños mínimos, contraste ≥ 7:1 y área segura, y avisa "No cabe" en vez de achicar la letra.

## Operating Context

- Proyección en el templo, normalmente un sábado por la mañana, con la sala iluminada. Proyector o TV de 16:9; algunos televisores recortan los bordes (overscan).
- Tipos de anuncio: culto/programa, salida o excursión, aviso general, reunión, campaña o colecta, cumpleaños, slide de imagen. Cada tipo tiene color de acento e ícono.
- La fecha es el dato más buscado: los anuncios hablan de eventos de la semana o del mes.

## Capabilities and Constraints

- Offline y determinista (C-01, C-03): ningún recurso de red; misma entrada, misma slide.
- Una sola fuente local: Atkinson Hyperlegible (400 y 700). Sin cursivas para información; mayúsculas sostenidas solo en una línea.
- Lienzo 1920×1080, área segura 96 px horizontal y 64 px vertical.
- Mínimos §5.3 (v1.4): título 84, datos clave 60, secundario 44, cumpleaños uno 108, varios 54, metadatos 32. Íconos opcionales, ≥ 56 px.
- Contraste de texto ≥ 7:1; nunca texto sobre foto sin un fondo verificado; logos ≥ 3:1.
- Máx. 6 líneas informativas y ~40 palabras corridas por slide.
- Temas claros y oscuros, y color personalizado (el motor ajusta el fondo para llegar a 7:1).

## Brand Commitments

- Logo IASD monocromo (negro `#12100b` o blanco), elegido automáticamente según el fondo. Falta el isotipo.
- El estilo de las slides es propio y **no** sigue el `DESIGN.md` de la interfaz (que se elige en P4).
- Rechazado (2026-11-01): slides planas, listas de filas con chips de ícono, todo al mismo tamaño, fondos sin capas. "Muy de IA, sin corazón."

## Evidence on Hand

- Logos IASD en `src/assets/logos/iglesia/`. Datos de ejemplo en `tests/fixtures/announcements.ts`.
- No hay fotos reales de la iglesia ni de eventos en el repo; no inventarlas como reales.

## Product Principles

1. Primero se lee, después se admira: ninguna decisión visual baja la legibilidad por debajo de §5.
2. La fecha manda: es lo primero que el ojo encuentra.
3. Cada tipo se reconoce de un vistazo, por color y forma, nunca solo por color.
4. Calidez de comunidad, no frialdad de tablero.

## Accessibility & Inclusion

**Slides:** WCAG AAA para el texto (7:1), tipografía para baja visión, distancia de lectura de 12–15 m. **Interfaz:** WCAG AA como mínimo, foco visible, todo usable con teclado y en el celular. En ambas, la información nunca depende solo del color.
