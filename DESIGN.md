---
version: "alpha"
name: "Anuncios del Sábado — interfaz (basado en NDS Core)"
description: "Sistema de diseño de la INTERFAZ de la app (formularios, listas, configuración, vista del presentador). Adaptado de NDS Core (designmd.app) para una app de trabajo usada por un equipo con soltura tecnológica. No aplica a las slides."
colors:
  light:
    background: "#F3F0D6"
    surface: "#FFFFFF"
    muted: "#E8E5D0"
    ink: "#1A1A1A"
    ink-muted: "#55513F"
    hairline: "#CFCAAE"
    field-border: "#857F63"
    danger: "#9E2A1F"
    danger-bg: "#F6DCD3"
    success: "#2E6230"
    success-bg: "#DCE9CF"
    warning: "#7A5300"
    warning-bg: "#F5E2B3"
  dark:
    background: "#0A0A0A"
    surface: "#141414"
    muted: "#1F1F1F"
    ink: "#FFFFFF"
    ink-muted: "#B9B6A3"
    hairline: "#2E2E2E"
    field-border: "#6B6B6B"
    accent: "#F5F5DC"
typography:
  display:
    fontFamily: "Instrument Serif"
    fontSize: "2rem-2.75rem"
    fontWeight: 400
  heading:
    fontFamily: "Instrument Serif"
    fontSize: "1.5rem-1.75rem"
    fontWeight: 400
  body:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    fontWeight: 500
  meta:
    fontFamily: "ui-monospace, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    textTransform: "uppercase"
    letterSpacing: "0.08em"
rounded:
  sm: 4px
  md: 8px
  lg: 16px
spacing:
  base: 8px
  scale: [4px, 8px, 12px, 16px, 24px, 32px, 48px]
  page: "px-4 md:px-8"
  container: "max-w-7xl"
---

## Overview

Este archivo define cómo se ve **la interfaz** de Anuncios del Sábado: Inicio, el editor de anuncios con su vista previa, las listas, la presentación del día, la configuración y la vista del presentador. **No aplica a las slides**, que tienen sus propios estilos (Himnario, Almanaque, Cartel) y sus reglas en SRS §5.

Parte de **NDS Core** (National Design Studio, vía designmd.app): fondo crema y tinta negra, títulos en serifa e Inter para leer, sin sombras y con autoridad tranquila. Se adapta de un sitio de presentación a una **app de trabajo**: espaciado de aplicación (no de portada), componentes de formulario, estados (error, éxito, aviso) y densidad pensada para gente que usa la app cada semana.

### Para quién es

El **equipo de anuncios**: jóvenes y adultos que manejan bien la tecnología, sin formación de diseño. Cargan un anuncio en unos 2 minutos, desde el celular o la laptop (SRS §2.1, RNF-03). La interfaz debe ser **rápida, clara y eficiente**: no explica lo obvio ni trata al usuario como principiante. Las personas mayores y con baja visión son público de **las slides**, no de esta interfaz.

### Principios

1. **La slide es la protagonista.** La interfaz es un marco sobrio (crema, tinta, sin color de marca) para que la vista previa, con sus colores, sea lo que se ve.
2. **Rápido de usar.** Lo frecuente queda a un toque o un atajo: nuevo anuncio, duplicar, guardar. El formulario sigue el orden en que llega la información (título, fecha, hora, lugar).
3. **Claridad antes que decoración.** La jerarquía sale de la tipografía (serifa para títulos, Inter para leer) y del espacio, no de sombras ni de colores.
4. **Los errores dicen qué hacer.** Junto al campo culpable, en español, con la acción ("acórtalo o muévelo a las notas del presentador", RF-10).
5. **Funciona sin internet.** Fuentes e íconos empaquetados; nada se carga de otro origen (C-03).

## Colors

### Tema claro (por defecto)

| Token | Hex | Uso |
|---|---|---|
| `background` | `#F3F0D6` | Fondo de página (crema) |
| `surface` | `#FFFFFF` | Tarjetas, campos, paneles, la vista previa enmarcada |
| `muted` | `#E8E5D0` | Secciones alternas, filas seleccionadas, campos deshabilitados |
| `ink` | `#1A1A1A` | Texto, botón principal, foco |
| `ink-muted` | `#55513F` | Texto secundario, ayudas, contadores (≥ 4.5:1 sobre `background` y `surface`) |
| `hairline` | `#CFCAAE` | Divisores y bordes de tarjetas (decorativos) |
| `field-border` | `#857F63` | Borde de campos y controles (≥ 3:1, WCAG 1.4.11) |
| `danger` / `danger-bg` | `#9E2A1F` / `#F6DCD3` | "No cabe", errores de validación, borrar |
| `success` / `success-bg` | `#2E6230` / `#DCE9CF` | Guardado, "Lista para usar sin internet" |
| `warning` / `warning-bg` | `#7A5300` / `#F5E2B3` | Imagen de baja resolución (RF-42), color ajustado, sin sincronizar |

Los colores de estado son apagados, en la misma familia terrosa: nunca saturados. El color **de cada tipo de anuncio** (`TYPE_ACCENTS` de las slides) solo aparece como una marca pequeña (punto o borde) junto al ícono del tipo, nunca como fondo de la interfaz.

### Tema oscuro (vista del presentador y preferencia del sistema)

| Token | Hex | Uso |
|---|---|---|
| `background` | `#0A0A0A` | Fondo |
| `surface` | `#141414` | Tarjetas y paneles |
| `muted` | `#1F1F1F` | Secciones alternas |
| `ink` | `#FFFFFF` | Texto |
| `ink-muted` | `#B9B6A3` | Texto secundario |
| `field-border` | `#6B6B6B` | Borde de campos (≥ 3:1) |
| `accent` | `#F5F5DC` | Botón principal y foco |

La vista del presentador (P6) usa siempre el tema oscuro: en el templo, una pantalla clara junto al público distrae.

## Typography

| Token | Fuente | Tamaño | Uso |
|---|---|---|---|
| `display` | Instrument Serif 400 | 2rem–2.75rem | Título de pantalla ("Anuncios", "Nuevo anuncio") |
| `heading` | Instrument Serif 400 | 1.5rem–1.75rem | Títulos de sección y de tarjeta |
| `body` | Inter 400 | 1rem / 1.5 | Texto, valores de campos |
| `label` | Inter 500 | 0.875rem | Etiquetas de campo, botones secundarios, pestañas |
| `meta` | monoespaciada 500, mayúsculas | 0.75rem | Solo metadatos cortos: contadores ("42/60"), fechas en listas, "BORRADOR" |

- Instrument Serif solo para títulos; **nunca** para texto corrido, etiquetas ni campos.
- Inter para todo lo que se lee o se escribe. Campos de texto a 16 px (evita el zoom automático de iOS).
- Las fuentes se empaquetan con `@fontsource` (licencia OFL) y se precargan en el Service Worker. Las slides siguen usando Atkinson Hyperlegible.

## Layout

- **Contenedor:** hasta 1280 px de ancho, márgenes de 16 px en el celular y 32 px desde 768 px.
- **Ritmo:** base de 8 px. Entre campos 16 px, entre grupos 24–32 px, entre secciones 48 px. Nada de las secciones de 128 px de NDS: esto es una app, no una portada.
- **Editor (SRS §6.3):** desde 1024 px, formulario a la izquierda (≈ 40 %) y vista previa a la derecha, fija al desplazar. En el celular, la vista previa va arriba, plegable, y el formulario debajo.
- **Inicio:** botón "Nuevo anuncio" arriba, la presentación del próximo sábado como tarjeta y la lista de anuncios activos.
- **Zonas táctiles:** ≥ 44 × 44 px en el celular. En la laptop los controles pueden ser más compactos (36–40 px de alto).

## Components

### Botones

| Variante | Claro | Oscuro | Uso |
|---|---|---|---|
| Principal | fondo `ink`, texto `background` | fondo `accent`, texto `#0A0A0A` | **Una** por pantalla: "Guardar", "Presentar" |
| Secundario | borde 1 px `ink`, fondo transparente | borde `ink` | Duplicar, cancelar, acciones de fila |
| Fantasma | sin borde, subrayado al pasar | igual | Acciones terciarias, enlaces |
| Peligro | texto `danger`, borde `danger` | igual | Eliminar (siempre con confirmación o deshacer) |

Radio 4 px, alto 44 px (40 px en la laptop), relleno horizontal 16–24 px, etiqueta en Inter 500.

### Campos de formulario

- Etiqueta encima (`label`), campo en `surface` con borde 1 px `field-border`, radio 4 px y alto 44 px.
- **Foco:** borde 2 px `ink` y anillo de 2 px separado 2 px. Siempre visible con teclado.
- **Contador** de caracteres a la derecha de la etiqueta, en `meta`; pasa a `warning` al 90 % del `maxLength` y a `danger` al llegar.
- **Error y "No cabe":** borde 2 px `danger`, mensaje debajo en `danger` con ícono (nunca solo color) y la acción sugerida (RF-10).
- Obligatorios marcados con "*" y una línea de ayuda al inicio del formulario; los opcionales no llevan "(opcional)".
- Fechas y horas con los selectores nativos del navegador.

### Selector de tipo (paso 1)

Tarjetas en rejilla (2 columnas en el celular, 3–4 en la laptop): ícono Lucide de 32 px, nombre en `heading` y una línea de descripción en `ink-muted`. La marca del color del tipo es un borde superior de 4 px.

### Vista previa

La slide va dentro de un marco `surface` con borde `hairline`, en 16:9, escalada con `SlideCanvas`. Debajo, una línea de estado:
- `ok` → nada, o un check discreto;
- `midiendo` → nada (no parpadea);
- `no_cabe` → banda `danger-bg` con el campo culpable como enlace que lleva al campo.

Debajo van los selectores de plantilla, estilo, tema y "Logo en la slide" (SRS §6.3).

### Listas y tarjetas

Filas con borde inferior `hairline` (no tarjetas sueltas) para las listas largas. Cada fila lleva la marca del tipo, el título, la fecha en `meta` y las acciones al final. Las etiquetas de estado ("BORRADOR", "NO CABE", "PASADO") van en `meta` sobre su color `-bg`.

### Avisos

Bandas a todo el ancho del contenedor, con fondo `-bg`, texto del color de estado, ícono a la izquierda y radio 8 px. Se cierran con una ×. Nunca hay modales para avisos; los modales son solo para confirmar acciones destructivas.

## Do's and Don'ts

### Sí

- Instrument Serif para títulos de pantalla y sección; Inter para todo lo demás.
- Contraste mínimo 4.5:1 en la interfaz (WCAG 2.2 AA), con foco siempre visible.
- Atajos de teclado para lo frecuente: `N` para un nuevo anuncio, `Ctrl+S` para guardar y `Esc` para cerrar.
- Dejar que la vista previa sea lo único con color fuerte de la pantalla.
- Mensajes en español, cortos, que digan qué pasó y qué hacer.

### No

- No usar Instrument Serif en texto corrido, campos ni botones.
- No usar colores saturados fuera de la paleta: el color está en las slides.
- No usar sombras pesadas: la jerarquía sale del color de fondo y del borde.
- No usar radios mayores de 16 px.
- No escribir etiquetas largas en mayúsculas (`meta` es solo para metadatos de 1–2 palabras).
- No aplicar este archivo a las slides.

## Attribution

| Campo | Valor |
|---|---|
| Base | NDS Core — National Design Studio ([ndstudio.gov](https://ndstudio.gov)), vía [designmd.app/brands/nds-core](https://designmd.app/brands/nds-core) |
| Adaptación | Para una app de trabajo: componentes de formulario, estados, densidad de aplicación y tema oscuro para el presentador |
| Elegido por | El responsable, entre DSGov, Wellhub Yoga y NDS Core (2026-11-01) |
| Fuentes | Instrument Serif e Inter (SIL OFL), empaquetadas localmente |
