# SRS — Generador de Slides de Anuncios para la Iglesia

> **Nombre provisional:** Anuncios del Sábado
> **Versión del documento:** 1.4 — 1 de noviembre de 2026
> **Destinatario principal:** agente de desarrollo (Claude Code) y el responsable del proyecto.
> **Estado:** lista para empezar la Fase 1. Las preguntas bloqueantes de §13 ya están respondidas.

### Historial de cambios

| Versión | Cambios |
|---|---|
| 1.0 | Versión inicial. |
| 1.1 | Se elimina el concepto de anuncio "destacado" y la división de un anuncio en 2 slides (fuera del MVP). Cumpleaños: modo "varios por slide" o "uno por slide", y sin avatares cuando no hay foto. Biblioteca de logos de la iglesia y de los ministerios. La vista del presentador pasa al MVP. La hoja impresa se reemplaza por una vista de lectura para el celular. Persistencia en la nube desde el MVP (local-first + Supabase). Hosting en Hostinger. Múltiples fuentes en F2. Stack definido: Vue 3 + Vite + TypeScript. |
| 1.2 | Respuestas del responsable incorporadas: modo extendido confirmado; Windows + Chrome o Brave; logo por anuncio = iglesia local (por defecto) o ninguno; cumpleaños con modo **híbrido** y "uno por slide" por defecto; cuentas por persona y una cuenta compartida de equipo; vista de lectura pública; subdominio propio con despliegue por FTP; proyecto de código abierto. |
| 1.3 | Quitar fondo (F2): la opción principal pasa a ser **RMBG-1.4 + transformers.js** en lugar de `@imgly/background-removal`, para evitar la AGPL y mantener el proyecto con licencia MIT. |
| 1.4 | Rediseño de las slides: el responsable acepta bajar ~12 % los tamaños de §5.3 (opción "moderada") para ganar composición y contraste de escala; los íconos de §5.4 pasan a ser opcionales (≥ 56 px si se dibujan). Interlineado por rol (§5.2). Tres estilos de slide elegibles por anuncio (§9) y logos de hasta 3 ministerios, en logotipo o isotipo (RF-37). |

---

## 0. Cómo usar este documento (instrucciones para el agente)

1. Lee el documento completo antes de escribir código.
2. Las secciones **§2.4 (Restricciones)** y **§5 (Reglas de legibilidad)** son **innegociables**. Si una decisión técnica entra en conflicto con ellas, ganan ellas.
3. Implementa por fases (§11). No adelantes funcionalidades de fases posteriores salvo que el responsable lo pida.
4. Cada requisito tiene un ID (`RF-xx`, `RNF-xx`) y una prioridad: **MVP**, **F2** o **F3**. Usa esos IDs en commits, tareas y PRs.
5. Revisa **§13**: las decisiones confirmadas (§13.1) y las preguntas abiertas (§13.2). Las bloqueantes deben estar respondidas antes de la tarea que afectan. Para el resto, usa el valor por defecto indicado y déjalo anotado.
6. **Presentar debe funcionar sin internet.** No agregues dependencias que carguen nada desde una CDN en tiempo de ejecución (ni fuentes, ni scripts, ni modelos). La nube se usa para sincronizar, nunca como requisito para presentar.

---

## 1. Introducción

### 1.1 Propósito

Construir una aplicación web que genere **slides de anuncios** para proyectarlos en las pantallas de la iglesia durante el espacio de anuncios del sábado. Las slides se generan de forma **determinística** a partir de datos estructurados (tipo de anuncio, fecha, lugar, precio, etc.) y de **plantillas predefinidas**, sin usar inteligencia artificial.

### 1.2 Planteamiento original del proyecto (contexto del responsable)

> Resumen organizado de la idea tal como la planteó el responsable.

**El problema.** En la iglesia se dedican unos 10 minutos cada sábado a dar los anuncios de la semana o del mes. Hoy se dan solo de palabra, y la información se pierde: la gente olvida la fecha, el precio o algún detalle importante.

**La idea.** Una herramienta que genere las diapositivas de los anuncios:

- Cada anuncio se convierte en su propia slide.
- Los anuncios se crean **llenando los datos clave** y **eligiendo el tipo de anuncio** (culto, salida, obra misionera, cumpleaños, etc.). Opcionalmente se eligen los **colores principales** y una **plantilla** concreta entre las disponibles.
- Se pueden **subir imágenes** a un anuncio (por ejemplo, la foto del predicador de un culto, ya sin fondo).
- Si un anuncio **ya viene diseñado** (por ejemplo, un flyer hecho en Canva), se agrega **tal cual** a la cola de anuncios, sin editarlo.
- Las slides pueden llevar un **logo**: normalmente el de la iglesia local (que tiene varias versiones), ninguno o, en algunos casos, el de un ministerio (Sociedad de Jóvenes, Ministerio de la Mujer, etc.). Los logos se irán agregando a medida que avance el proyecto.
- El objetivo es dar una **ayuda visual** a la congregación y también **a la persona que da los anuncios**, para que tenga a mano los puntos clave (lugar, nombre de la actividad, fecha, etc.).

**Restricciones expresadas por el responsable:**

- **Sin IA**: nadie va a mantener una suscripción. Todo debe generarse programáticamente.
- **No es un Canva**: no se busca un editor libre. Ya existe Canva para eso. El problema es que casi nunca hay quien tenga tiempo o habilidad para diseñar los flyers. Lo que se quiere es **generarlos rápido**, con la posibilidad de **ajustar dos o tres cosas** como un plus.
- **Legibilidad a distancia**: las slides se ven en pantallas desde lejos, y en la congregación hay **adultos mayores y personas con baja visión**. Las letras y los gráficos deben verse con total claridad. Las herramientas de IA (Gamma, ChatGPT, etc.) suelen generar slides con texto demasiado pequeño, y eso **no puede pasar aquí**.
- **Pantallas 16:9**: la iglesia usa televisores o pantallas, no proyector.
- **Funcionamiento sin internet**: es **importantísimo**.
- **Costo cero**: se puede usar el hosting compartido que el responsable ya tiene en Hostinger y servicios gratuitos (Supabase o Firebase) para la persistencia.

**Ideas a futuro (fuera del MVP):**

- **Galería de assets** reutilizables por tipo de anuncio. Por ejemplo, para una obra misionera: un megáfono, una Biblia o el folleto que se reparte en las caminatas. Los assets se colocan en **posiciones estratégicas predefinidas** y, si es posible, la persona puede **moverlos** un poco.
- **Quitar el fondo de fotos dentro de la app**, solo si se puede hacer **gratis**.
- **Distintas fuentes** según el estilo del anuncio o de la plantilla.

### 1.3 Alcance

**Incluido en el MVP:** gestión de anuncios con formularios por tipo, plantillas y temas de color, biblioteca de logos, motor de renderizado con reglas de legibilidad automáticas, slides de imagen ya diseñadas, cola de presentación ordenable, modo presentación con **vista del presentador**, **vista de lectura para el celular**, funcionamiento offline y sincronización en la nube.

**Fases posteriores:** galería de assets, quitar fondo, múltiples fuentes, modo bucle, exportaciones, registro de miembros.

**Excluido:** ver §12.

### 1.4 Glosario

| Término | Definición |
|---|---|
| **Anuncio** | Unidad de información que se comunica (un evento, un aviso, los cumpleaños). |
| **Tipo de anuncio** | Categoría que define qué campos pide el formulario y qué plantillas aplican (culto, salida, cumpleaños…). |
| **Plantilla** | Diseño visual (layout) que convierte los datos de un anuncio en slides. |
| **Tema** | Conjunto de colores aplicado a una plantilla. |
| **Slide** | Una pantalla de 1920×1080 px lógicos. |
| **Slide de imagen** | Slide formada por una imagen ya diseñada (flyer externo), sin edición. |
| **Presentación / Cola** | Lista ordenada de anuncios que se proyectará un día concreto. |
| **Ministerio** | Departamento u organización de la iglesia que organiza un anuncio (la iglesia misma, la Sociedad de Jóvenes, el Ministerio de la Mujer…). Tiene uno o varios logos. |
| **Variante de logo** | Versión de un mismo logo: a color, blanco, negro; horizontal o vertical. |
| **Ventana pública** | Ventana que se ve en las pantallas. No muestra ningún control. |
| **Vista del presentador** | Ventana de control en la laptop: maneja la ventana pública y muestra los puntos clave. |
| **Vista de lectura** | Página optimizada para el celular con todos los anuncios del día en texto. |
| **Asset** | Imagen decorativa reutilizable (megáfono, Biblia, folleto…). F2. |
| **Slot** | Posición predefinida dentro de una plantilla donde puede ir un logo, una foto o un asset. |

---

## 2. Descripción general

### 2.1 Usuarios

| Rol | Descripción | Necesidades clave |
|---|---|---|
| **Encargado de anuncios** | Recibe los anuncios durante la semana y los carga. No necesariamente es técnico. | Formulario rápido (≈2 min por anuncio), desde el celular o la laptop. |
| **Operador** | Proyecta el sábado desde la laptop conectada a las pantallas. | Abrir la presentación del día y controlarla sin complicaciones, aunque no haya internet. |
| **Presentador** | Da los anuncios de palabra. | Ver los puntos clave de cada anuncio, en la vista del presentador o en su celular. |
| **Congregación** | Público, incluidos adultos mayores y personas con baja visión. | Leer todo con claridad desde lejos. |

> Una misma persona puede tener varios roles. Solo quienes **editan** necesitan cuenta (§8.5). Presentar y leer no requieren sesión si los datos ya están en el dispositivo.

### 2.2 Entorno operativo

- **Salida:** pantallas o televisores **16:9** conectados a una laptop en **modo extendido** (confirmado): la pantalla de la laptop muestra la vista del presentador y las pantallas muestran la ventana pública.
- **Equipo de proyección:** laptop con **Windows** y **Chrome o Brave** (últimas 2 versiones). Por ahora es siempre la misma laptop. Brave está basado en Chromium, pero sus protecciones (Shields) pueden bloquear algunas APIs: **probar todo en Brave además de Chrome** (RF-65, RF-102).
- **Conectividad:** **sin internet garantizado** en la iglesia.
- **Carga de datos:** durante la semana, desde cualquier dispositivo, normalmente con internet.
- **Hosting:** hosting compartido estático del responsable en **Hostinger** (§8.6).

### 2.3 Supuestos

- Los textos son en **español** (locale `es-DO`, República Dominicana).
- La moneda por defecto es el **peso dominicano (RD$)**.
- La resolución lógica de diseño es **1920×1080** y se escala a la pantalla real.

### 2.4 Restricciones (innegociables)

| ID | Restricción |
|---|---|
| **C-01** | **Sin IA** ni servicios de pago. Toda generación es determinística: mismos datos + misma plantilla = misma slide. |
| **C-02** | **Costo de operación $0**: hosting existente en Hostinger y el plan gratuito del backend (sin tarjeta de crédito registrada). |
| **C-03** | **Offline-first**: crear, editar y presentar funcionan sin red. La nube solo sincroniza. Si el backend está caído o pausado, la app sigue funcionando con los datos locales. |
| **C-04** | **Las reglas de legibilidad (§5) las impone la app**, no el usuario. Nadie puede elegir un tamaño de letra por debajo del mínimo ni un contraste insuficiente. |
| **C-05** | **No es un editor libre**: nada de capas arbitrarias, cajas de texto libres, rotaciones ni efectos. |
| **C-06** | **Formato 16:9** fijo. |
| **C-07** | **MVP: un anuncio = una slide.** Las únicas excepciones son los cumpleaños (§3.3), la portada y el cierre. |

---

## 3. Requisitos funcionales

### 3.1 Gestión de anuncios

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Crear un anuncio eligiendo primero su **tipo**. El formulario muestra solo los campos de ese tipo. | MVP |
| RF-02 | Editar, duplicar y eliminar anuncios. **Duplicar** permite reutilizar un anuncio recurrente cambiando solo la fecha. | MVP |
| RF-03 | **Vista previa en vivo** de la slide mientras se llena el formulario. | MVP |
| RF-04 | Validar los campos obligatorios por tipo y mostrar errores claros en español. | MVP |
| RF-05 | *(Eliminado en v1.1. No hay anuncios "destacados".)* | — |
| RF-06 | **Notas para el presentador** por anuncio (texto libre que no se proyecta). | MVP |
| RF-07 | Cuando la fecha del evento ya pasó, el anuncio pasa a **"Pasados"** (archivado, no borrado). | MVP |
| RF-08 | Lista de anuncios con filtros: activos, pasados y por tipo. | MVP |
| RF-09 | Selector **"Logo en la slide"**: **logo de la iglesia** (por defecto), **ninguno** o el logo de un ministerio de la biblioteca (§3.5). | MVP |
| RF-10 | Si el contenido **no cabe** en la slide respetando los mínimos de §5, el formulario lo indica en rojo en el campo culpable ("Este texto es muy largo para leerse bien desde lejos; acórtalo o muévelo a las notas del presentador"). Un anuncio en ese estado se puede guardar como **borrador**, pero **no** se puede agregar a una presentación. | MVP |

### 3.2 Tipos de anuncio

Los tipos se definen **de forma declarativa** (esquema de datos), no con código específico por tipo, para poder agregar tipos nuevos fácilmente (§7).

| Tipo | Campos obligatorios | Campos opcionales | Prioridad |
|---|---|---|---|
| **Culto / Servicio especial** | Título, fecha, hora | Predicador/a, foto del predicador (PNG sin fondo), lugar, tema o lema, versículo (texto escrito por el usuario) | MVP |
| **Salida / Excursión** | Título, fecha, hora de salida | Destino, punto de encuentro, precio (RD$), qué llevar, fecha límite de pago o inscripción, contacto | MVP |
| **Obra misionera / Evangelismo** | Título, fecha, hora | Punto de encuentro, zona o sector, qué llevar, contacto | MVP |
| **Cumpleaños** | Ver §3.3 | Ver §3.3 | **MVP** |
| **Actividad general** | Título, fecha | Hora, lugar, descripción corta, precio, contacto | MVP |
| **Aviso breve** | Título, mensaje corto | Fecha, contacto | MVP |
| **Slide de imagen** | Una imagen | Título interno (no se proyecta), notas para el presentador | MVP |
| **Recaudación / Venta** | Título, fecha | Producto, precio, meta, contacto, lugar | F2 |

**Formato de los datos al renderizar:**
- Fechas: `Intl.DateTimeFormat('es-DO')` en formato largo y legible, por ejemplo "Sábado 7 de noviembre". Si el año no es el actual, se agrega.
- Horas: formato 12 h, por ejemplo "7:00 p. m.".
- Precios: `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })` → "RD$500". Sin decimales si son ,00.

### 3.3 Cumpleaños

| ID | Requisito | Prioridad |
|---|---|---|
| RF-20 | Un anuncio de cumpleaños contiene una lista de personas: **nombre** (obligatorio), **día y mes** (obligatorios) y **foto** (opcional). Además tiene un mensaje opcional (por defecto "¡Feliz cumpleaños!") y un versículo opcional. | MVP |
| RF-21 | El usuario elige el **modo de presentación**: **"Uno por slide"** (**por defecto**, el uso más común), **"Varios en una slide"** o **"Híbrido"**: cada persona **con foto** tiene su propia slide y las personas **sin foto** se agrupan juntas en una o más slides. | MVP |
| RF-22 | **Uno por slide, con foto:** foto grande (retrato recortado o PNG sin fondo) a un lado; nombre muy grande, día y mensaje al otro. | MVP |
| RF-23 | **Uno por slide, sin foto:** **no se usa avatar**. El **nombre ocupa el centro de la pantalla** y la mayor parte del espacio (tamaño máximo que permita el ajuste automático), con el día y el mensaje en un tamaño menor. | MVP |
| RF-24 | **Varios en una slide:** ordenados por día. **Sin avatares ni huecos.** Se admiten **fotos mezcladas**: quien tiene foto aparece en tarjeta con foto y nombre; quien no, en una tarjeta del mismo tamaño con el nombre grande. Si nadie tiene foto, solo se muestran los nombres en una o dos columnas. | MVP |
| RF-25 | Capacidad orientativa en "Varios en una slide": hasta **6 personas con foto** (3×2) o hasta **8 sin foto** (2 columnas × 4). El valor real lo decide el motor según §5. Si se excede, las personas se **reparten automáticamente** en varias slides con el indicador "(1/2)". | MVP |
| RF-26 | El alcance del MVP son los **cumpleaños de la semana**. No se generan cumpleañeros de un mes completo. | MVP |
| RF-27 | **Registro de miembros** con fecha de cumpleaños, para generar automáticamente los cumpleañeros de la semana sin escribirlos cada vez. | F2 |

> **Privacidad:** no se muestra ni se pide el año de nacimiento ni la edad.

### 3.4 Plantillas y temas

| ID | Requisito | Prioridad |
|---|---|---|
| RF-30 | Cada tipo de anuncio tiene **al menos 2 plantillas** en el MVP: **"Clásica"** (fondo sólido o degradado y datos en columna) y **"Visual"** (banda de color y foto o imagen grande en un lateral). | MVP |
| RF-31 | Selección de **tema de color**: paletas predefinidas y, además, un color primario personalizado. | MVP |
| RF-32 | Al elegir un color personalizado, la app **deriva automáticamente** los colores de texto y fondo cumpliendo el contraste mínimo de §5. Si no es posible, ajusta la luminosidad del color y avisa al usuario. | MVP |
| RF-33 | **Tema por defecto de la iglesia** configurable y aplicado a todo. Mientras no se definan los colores institucionales, se usa un tema neutro (azul oscuro y blanco). | MVP |
| RF-34 | Temas por defecto por ministerio. | F2 |

### 3.5 Biblioteca de logos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-35 | El **logo principal es el de la iglesia local**, que tiene varias **variantes** (a color, blanco, negro; horizontal o vertical). Viene **precargado** en la app desde el MVP. | MVP |
| RF-36 | Los logos de los ministerios (Sociedad de Jóvenes, Ministerio de la Mujer, etc.) se **irán agregando** con el tiempo: precargados en el código (`src/assets/logos/`) o **subidos desde la app** (preferiblemente PNG transparente o SVG). También se pueden crear ministerios nuevos. | MVP |
| RF-37 | La plantilla define un **slot de logo** dentro del área segura. La app elige **automáticamente la variante** según el fondo: el logo blanco sobre fondos oscuros y el de color o negro sobre fondos claros, validando que se distinga bien. Si un logo no tiene la variante adecuada, usa la mejor disponible sobre una pequeña placa de fondo que garantice contraste. | MVP |
| RF-38 | Cada slide muestra **un solo logo o ninguno**, según RF-09. Por defecto, el de la iglesia local. | MVP |
| RF-39 | Tamaño del logo acotado: suficiente para reconocerse (alto ≥ 90 px) sin competir con la información (alto ≤ 160 px). En la portada puede ser mayor. | MVP |

### 3.6 Slides de imagen (flyers ya diseñados)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-40 | Subir PNG, JPG o WebP como slide completa, **sin edición** y sin logo superpuesto. | MVP |
| RF-41 | Si la imagen **no es 16:9**, se muestra completa (`object-fit: contain`) y los espacios sobrantes se rellenan con **la misma imagen difuminada** y oscurecida, nunca con barras negras. | MVP |
| RF-42 | Advertencia (no bloqueo) si la imagen tiene baja resolución (< 1280 px de ancho). Las imágenes verticales (por ejemplo, flyers de WhatsApp o Instagram) se aceptan con relleno difuminado. | MVP |

### 3.7 Presentación (cola del día)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-50 | Crear una **presentación** para una fecha (por defecto, el próximo sábado). | MVP |
| RF-51 | Agregar anuncios a la presentación y **reordenarlos arrastrando** (y con botones subir/bajar, por accesibilidad). | MVP |
| RF-52 | Al crear la presentación, **sugerir** los anuncios activos cuya fecha de evento es futura. | MVP |
| RF-53 | Slide opcional de **portada** ("Anuncios", con el logo de la iglesia) y de **cierre**, configurables. | MVP |
| RF-54 | Vista de **miniaturas** de todas las slides resultantes, con el conteo total. | MVP |
| RF-55 | **"Preparar para presentar sin internet"**: descarga al dispositivo todo lo necesario (datos, imágenes y logos) y muestra el indicador **"✓ Lista para usar sin internet"**. Si falta algo, dice qué. | MVP |

### 3.8 Modo presentación y vista del presentador

| ID | Requisito | Prioridad |
|---|---|---|
| RF-60 | Al presentar se abren dos ventanas: la **vista del presentador** en la laptop y la **ventana pública** en las pantallas. Se sincronizan localmente con `BroadcastChannel`, sin red. | MVP |
| RF-61 | La **ventana pública no muestra ningún control**: ni botones ni barras. El cursor se oculta. Solo se ve la slide a pantalla completa, escalada a 16:9. | MVP |
| RF-62 | La **vista del presentador** controla lo que se proyecta: anterior y siguiente, **saltar a cualquier slide** desde la tira de miniaturas, y **pantalla negra** o **pantalla de logo** (para pausas). | MVP |
| RF-63 | La vista del presentador muestra la **slide actual** y la **siguiente**, los **puntos clave** del anuncio actual en texto grande (título, fecha, hora, lugar, precio), las **notas del presentador**, el número de slide ("3 de 9") y la hora actual. | MVP |
| RF-64 | Teclado y clicker funcionan con cualquiera de las dos ventanas enfocada: `→`, `↓`, `Espacio`, `PageDown` = siguiente; `←`, `↑`, `PageUp` = anterior; `Inicio`/`Fin`; `B` = pantalla negra; `Esc` = salir. | MVP |
| RF-65 | **Flujo de apertura sencillo:** botón "Abrir pantalla pública", luego mover la ventana a las pantallas y hacer un clic en ella para ponerla en pantalla completa (el navegador exige ese gesto). Evaluar la *Window Management API* de Chromium para posicionarla automáticamente en la segunda pantalla. **Brave puede bloquear esa API** por protección contra fingerprinting, así que el **flujo manual con instrucciones en pantalla es el principal** y la API es solo una mejora cuando esté disponible. | MVP |
| RF-66 | **Modo de una sola ventana** (respaldo para cuando las pantallas están en espejo): la slide en pantalla completa, controlada solo con teclado o clicker, sin controles visibles. | MVP |
| RF-67 | Si se cierra la ventana pública por error, la vista del presentador la puede reabrir y vuelve a la misma slide. | MVP |
| RF-68 | Transición simple (fundido ≤ 300 ms) o ninguna. | MVP |
| RF-69 | **Modo bucle**: avance automático cada N segundos, para mostrar los anuncios en loop antes o después del servicio. | F2 |

### 3.9 Vista de lectura (celular)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-70 | Cada presentación tiene una **vista de lectura**: una página para celular con todos los anuncios del día **en texto** (título, datos clave y notas del presentador), en el mismo orden que la presentación. | MVP |
| RF-71 | Diseño de lectura: letra grande (base ≥ 18 px CSS), alto contraste, modo oscuro automático e íconos junto a los datos. Una tarjeta por anuncio con su número, para ubicarse rápido mientras se habla. | MVP |
| RF-72 | La vista de lectura es **pública**: está pensada para toda la congregación (por ejemplo, el enlace se comparte en el grupo de WhatsApp de la iglesia). Se accede por un **enlace** de la presentación publicada, sin iniciar sesión. Botón "Copiar enlace" y "Compartir" (Web Share API) en la pantalla de la presentación. | MVP |
| RF-73 | **Funciona sin internet** si se abrió al menos una vez con conexión: se guarda en caché en el celular, mostrando la fecha de la última actualización. | MVP |
| RF-74 | Las **notas del presentador nunca aparecen** en la vista pública. Los usuarios con sesión iniciada ven la misma vista con las notas incluidas (útil para el presentador). | MVP |
| RF-75 | Solo se ven presentaciones marcadas como **publicadas**. El enlace usa un identificador aleatorio no adivinable, para que no se puedan recorrer presentaciones ajenas o en borrador. | MVP |

### 3.10 Galería de assets

| ID | Requisito | Prioridad |
|---|---|---|
| RF-80 | Galería de assets precargados (SVG o PNG transparente) etiquetados por tipo: megáfono, Biblia, folleto, pastel, regalo, autobús, etc. Deben ser de licencia libre o creados para el proyecto. | F2 |
| RF-81 | El usuario puede **subir sus propios assets** (por ejemplo, la foto del folleto real) y etiquetarlos. | F2 |
| RF-82 | Cada plantilla define **slots** con posición, tamaño máximo y capa. El asset elegido cae en el slot sugerido. | F2 |
| RF-83 | Ajuste manual limitado: **mover y escalar** (por ejemplo, 50–150 %), **sin** rotación, sin salir del área segura y **sin tapar texto**. | F2 |
| RF-84 | Botón "Restablecer posición". | F2 |

### 3.11 Quitar fondo de fotos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-90 | Opción "Quitar fondo" al subir una foto de persona. Se ejecuta **en el navegador**, sin servidor, sin API, sin costo por imagen y sin límite de uso. | F2 |
| RF-91 | El modelo se **descarga una sola vez bajo demanda** (al usar la función por primera vez, no al instalar la app) y se **cachea localmente** para usarlo offline después. | F2 |
| RF-92 | Indicador de progreso (descarga del modelo y procesamiento). El resultado se puede aceptar o descartar, y se guarda como PNG transparente. | F2 |
| RF-93 | La función vive detrás de una **interfaz intercambiable** (`quitarFondo(imagen: Blob): Promise<Blob>`), de modo que se pueda cambiar el modelo sin tocar el resto de la app. | F2 |

**Decisión técnica:**

- **Opción principal: modelo `briaai/RMBG-1.4` ejecutado con `transformers.js`** (`@huggingface/transformers`), en su versión cuantizada (≈40–45 MB), con WebGPU cuando esté disponible y WASM como respaldo. Se ejecuta en un **Web Worker** para no congelar la interfaz.
  - **Licencias:** `transformers.js` es **Apache-2.0** (permisiva), así que el código del proyecto puede seguir siendo **MIT**. El modelo RMBG-1.4 tiene la licencia propia de BRIA (`bria-rmbg-1.4`): **gratis para uso no comercial**; el uso comercial requiere un acuerdo con BRIA. El uso interno de una iglesia, sin venta, es no comercial.
  - **Por qué la 1.4 y no la 2.0:** RMBG-2.0 tiene la misma restricción no comercial y mejor calidad, pero es mucho más pesada (cientos de MB), demasiado para laptops o celulares modestos. Para retratos, la 1.4 es suficiente.
- **Alternativa de licencia permisiva:** **BiRefNet** (MIT) vía `transformers.js`, por si el proyecto llegara a reutilizarse con fines comerciales. Gracias a RF-93, el cambio es solo de modelo.
- **Descartado:** `@imgly/background-removal`, porque su licencia **AGPL-3.0** obligaría a licenciar todo el proyecto como AGPL. También se descartan servicios web como remove.bg (de pago por créditos y requieren internet) y `rembg` (Python, requiere servidor).

**Reglas para el agente:**
1. **No incluir los pesos del modelo en el repositorio** como parte del código MIT. Se descargan aparte (desde Hugging Face o desde el propio hosting) y se cachean en el navegador.
2. Documentar en `LICENSES.md` el modelo, su licencia (`bria-rmbg-1.4`, uso no comercial) y el enlace a la licencia.
3. Mostrar un aviso discreto la primera vez: "Se descargarán ~45 MB una sola vez para quitar fondos sin internet".
4. Antes de dar la función por terminada, **validar la calidad con fotos reales de la iglesia** (fotos de celular, fondos de pared, poca luz, cabello suelto, ropa de color parecido al fondo). Si la calidad no alcanza, probar BiRefNet.

### 3.12 Tipografía múltiple

| ID | Requisito | Prioridad |
|---|---|---|
| RF-95 | Catálogo **curado** de fuentes. Cada plantilla o estilo puede usar una fuente distinta (por ejemplo, una más festiva para cumpleaños o una más sobria para cultos). | F2 |
| RF-96 | Una fuente entra al catálogo solo si cumple criterios de legibilidad: altura de x generosa, formas abiertas, distinción clara entre `I`, `l` y `1` y entre `O` y `0`, y disponibilidad de peso Bold. Las fuentes decorativas solo se permiten en elementos ornamentales sin información. | F2 |
| RF-97 | Todas las fuentes se **empaquetan localmente** con licencia libre (SIL OFL o similar). | F2 |

### 3.13 Datos, sincronización y respaldo

| ID | Requisito | Prioridad |
|---|---|---|
| RF-100 | Los datos se guardan **primero localmente** (IndexedDB) y se **sincronizan** con la nube cuando hay conexión (§8.4). | MVP |
| RF-101 | Indicador de estado de sincronización: "Sincronizado", "Cambios pendientes" o "Sin conexión". | MVP |
| RF-102 | Solicitar **almacenamiento persistente** (`navigator.storage.persist()`) para que el navegador no borre los datos locales. | MVP |
| RF-103 | **Exportar e importar respaldo** completo (`.zip` con los datos y las imágenes), como seguro independiente de la nube. | MVP |
| RF-104 | Exportar la presentación a **PDF** y a **PNG** (una imagen por slide). | F2 |
| RF-105 | Exportar a **.pptx** (con `pptxgenjs`). | F3 |

### 3.14 Configuración

| ID | Requisito | Prioridad |
|---|---|---|
| RF-110 | Nombre de la iglesia, ministerios (con sus logos), tema por defecto. | MVP |
| RF-111 | Textos por defecto (mensaje de cumpleaños, título de portada). | MVP |
| RF-112 | Moneda y formato de hora (valores por defecto: RD$ y 12 h). | MVP |
| RF-113 | Gestión básica de editores: **una cuenta por persona** y, opcionalmente, **cuentas compartidas de equipo** (por ejemplo, "Comunicaciones" o "Audiovisuales"). Todas tienen los mismos permisos en el MVP. Cada anuncio registra quién lo creó y quién lo editó por última vez. | MVP |

---

## 4. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-01 | **Offline** | Es una PWA instalable. Tras la primera carga, crear, editar y presentar funcionan sin red. Fuentes, íconos, logos y código se sirven localmente mediante Service Worker. |
| RNF-02 | **Legibilidad** | Cumplir íntegramente §5. Se verifica con pruebas automáticas. |
| RNF-03 | **Usabilidad** | Crear un anuncio típico en **≤ 2 minutos**. Interfaz 100% en español. Controles grandes. Formularios usables desde el celular. |
| RNF-04 | **Rendimiento** | Cambio de slide en < 100 ms (también entre ventanas). Vista previa en < 200 ms al teclear. Imágenes redimensionadas (lado mayor ≤ 2560 px; fotos de personas ≤ 1600 px) y comprimidas (WebP calidad ~82) antes de guardarlas y subirlas. |
| RNF-05 | **Determinismo** | Los mismos datos con la misma plantilla y el mismo tema producen siempre la misma salida. |
| RNF-06 | **Compatibilidad** | Presentación: **Chrome y Brave en Windows** (prioridad), Edge. Edición: Chrome, Brave y Edge de escritorio, Chrome Android y Safari iOS. Vista de lectura: cualquier navegador móvil moderno. Las pruebas E2E deben correr al menos en Chromium; validar manualmente en Brave antes de cada versión. |
| RNF-07 | **Costo** | $0. Hostinger (ya pagado) y el plan gratuito del backend, sin tarjeta registrada. |
| RNF-08 | **Mantenibilidad** | TypeScript estricto. Agregar un tipo de anuncio, una plantilla o un ministerio **no requiere tocar el motor**. |
| RNF-09 | **Licencias** | Todas las dependencias, fuentes, logos y assets deben tener licencias compatibles. Mantener `LICENSES.md`. |
| RNF-10 | **Robustez** | Si falta una imagen, un logo o un dato opcional, la slide se ve bien igualmente: nunca muestra huecos vacíos, "undefined" ni íconos de imagen rota. |
| RNF-11 | **Seguridad** | Acceso de escritura solo para usuarios autenticados (políticas RLS). La clave pública del backend en el frontend es aceptable porque la protección está en RLS. Ningún secreto de servidor en el código. |
| RNF-12 | **Resiliencia del backend** | Si el backend está pausado o caído, la app sigue funcionando con los datos locales y lo indica sin bloquear. |

---

## 5. Reglas de legibilidad (especificación de diseño)

> Esta sección es la razón de ser del proyecto. **Todas las plantillas deben cumplirla, y el motor debe hacerla cumplir.**

### 5.1 Lienzo y área segura

- Lienzo lógico: **1920 × 1080 px**.
- **Área segura:** margen de **96 px** horizontal y **64 px** vertical. Ningún texto, logo ni elemento importante puede salir de ella. Esto también protege contra el *overscan* de algunos televisores, que recortan los bordes.

### 5.2 Tipografía

- **MVP:** una sola fuente, **Atkinson Hyperlegible** (o Atkinson Hyperlegible Next), diseñada por el Braille Institute para personas con baja visión. Es de licencia libre (SIL OFL) y se **empaqueta localmente** (por ejemplo, con `@fontsource`); **nunca** se carga desde Google Fonts en tiempo de ejecución.
- **F2:** catálogo de fuentes por plantilla (RF-95 a RF-97). La arquitectura del MVP debe dejar la fuente como una **propiedad del tema o de la plantilla** (token), no fija en el CSS, para que el cambio sea trivial.
- Pesos: Bold (700) para títulos y datos clave, Regular (400) para el texto secundario.
- No se usan cursivas para información. Interlineado (v1.4, pedido del responsable): **1.05 en títulos y nombres**, **1.1 en texto secundario** y 1.2 en datos de una línea y metadatos. Nunca texto en MAYÚSCULAS sostenidas en más de una línea.

### 5.3 Tamaños mínimos (en px sobre el lienzo de 1080 de alto)

| Rol del texto | Tamaño preferido | **Mínimo absoluto** |
|---|---|---|
| Título del anuncio | 104–132 | **84** |
| Datos clave (fecha, hora, lugar, precio) | 70–84 | **60** |
| Texto secundario (descripción, qué llevar, contacto) | 52–56 | **44** |
| Nombre en cumpleaños, uno por slide | 140–230 | **108** |
| Nombres en cumpleaños, varios por slide | 62–84 | **54** |
| Metadatos no esenciales (por ejemplo "1/2") | 35 | **32** |

> El motor **nunca** renderiza texto informativo por debajo del mínimo. Si no cabe, aplica §5.6.
>
> v1.4: valores bajados ~12 % respecto de v1.3 (96 / 68 / 52 / 120 / 60 / 36) por decisión del responsable, para que las plantillas tengan contraste de escala (la fecha y el título protagonistas, el resto cerca del mínimo). Equivale a leer el texto más pequeño un ~12 % más cerca.

### 5.4 Densidad de contenido

- Máximo **6 líneas de contenido informativo** por slide, sin contar el título.
- Máximo **~40 palabras** de texto corrido. Lo demás va a las notas del presentador.
- Los **íconos** de los datos clave son **opcionales** (v1.4): cada plantilla decide si los usa. Si se dibujan, miden ≥ 56 px y van integrados en la composición (no como chips de interfaz). Son SVG locales (Lucide, empaquetado), no emojis del sistema. Un dato cuyo sentido no es obvio por su forma lleva una etiqueta corta ("Lugar", "Llevar:").

### 5.5 Contraste y color

- Contraste **mínimo 7:1** (WCAG AAA) entre el texto y su fondo inmediato, calculado con la fórmula de luminancia relativa de WCAG 2.x.
- El motor elige automáticamente texto claro u oscuro según el fondo y, si el tema no alcanza 7:1, ajusta el fondo hasta lograrlo.
- **Nunca texto directamente sobre una foto.** Siempre se usa un bloque sólido o un degradado que garantice 7:1 en la zona del texto.
- Logos: se elige la variante que contraste con el fondo (RF-37). Contraste mínimo orientativo de 3:1 entre el color dominante del logo y el fondo.
- La información **nunca** se transmite solo con color.

### 5.6 Ajuste automático de texto (MVP sin división)

Cada slot de texto de una plantilla declara `minFontSize`, `maxFontSize` y un área. Algoritmo:

1. Renderizar el texto en un contenedor oculto con las dimensiones del slot.
2. Buscar (búsqueda binaria) el mayor tamaño entre `max` y `min` con el que el texto cabe sin desbordarse.
3. Si con `min` **no cabe**, el anuncio queda en estado **"No cabe"**: el formulario señala el campo culpable (RF-10) y el anuncio no puede agregarse a una presentación. **En el MVP no se divide en dos slides.**
4. Para **ayudar a prevenir** esa situación, cada campo tiene un `maxLength` orientativo y un contador de caracteres visible.
5. **Excepción — cumpleaños en "Varios en una slide" o "Híbrido":** si hay más personas de las que caben, se reparten automáticamente en varias slides con "(1/2)" (RF-25).
6. La arquitectura debe permitir, en una fase futura, una **estrategia de división** por plantilla sin reescribir el motor.

### 5.7 Pruebas de legibilidad (obligatorias)

- Pruebas unitarias del cálculo de contraste, la selección de variante de logo y el algoritmo de ajuste.
- Pruebas que renderizan cada plantilla con **datos extremos** (títulos muy largos, nombres largos en cumpleaños, todos los campos opcionales llenos o todos vacíos, sin logo) y verifican que: (a) ningún texto quede por debajo del mínimo, (b) nada salga del área segura, (c) el contraste sea ≥ 7:1 y (d) los casos que no caben se detecten como "No cabe".
- Pruebas visuales (capturas) con Playwright para detectar regresiones.

---

## 6. Interfaz de usuario (pantallas)

1. **Inicio:** botón grande "Nuevo anuncio", la presentación del próximo sábado (con el indicador de "Lista para usar sin internet"), la lista de anuncios activos y el estado de sincronización.
2. **Nuevo anuncio, paso 1:** elegir el tipo, con tarjetas grandes con ícono.
3. **Nuevo anuncio, paso 2:** formulario a la izquierda y vista previa en vivo a la derecha (en el celular, la vista previa va arriba y es colapsable). Debajo de la vista previa: plantilla, tema y "Logo en la slide".
4. **Presentación del día:** lista ordenable, miniaturas y los botones "Presentar", "Preparar sin internet" y "Compartir vista de lectura".
5. **Vista del presentador** (laptop) y **ventana pública** (pantallas).
6. **Vista de lectura** (celular).
7. **Configuración:** iglesia, ministerios y logos, temas, usuarios, respaldo y almacenamiento.
8. **Inicio de sesión** (solo para editar).
9. (F2) **Galería de assets** y **Registro de miembros**.

---

## 7. Modelo de datos (orientativo)

```ts
// ---- Definición declarativa de tipos (data-driven, en código) ----
type FieldKind =
  | 'text' | 'longtext' | 'date' | 'time' | 'money'
  | 'image' | 'people' | 'list' | 'ministry';

interface FieldDef {
  key: string;                 // 'fecha', 'lugar', 'precio'...
  label: string;               // etiqueta en español
  kind: FieldKind;
  required: boolean;
  role?: 'title' | 'key' | 'secondary' | 'presenter-only';
  icon?: string;
  maxLength?: number;          // límite orientativo (§5.6)
}

interface AnnouncementTypeDef {
  id: string;                  // 'culto' | 'salida' | 'obra_misionera' | 'cumpleanos' | ...
  name: string;
  icon: string;
  fields: FieldDef[];
  templateIds: string[];
  defaultTemplateId: string;
}

// ---- Campos comunes de sincronización ----
interface SyncMeta {
  id: string;                  // UUID generado en el cliente
  updatedAt: string;           // ISO; resolución de conflictos (§8.4)
  deletedAt?: string | null;   // borrado lógico, necesario para sincronizar
}

// ---- Entidades persistidas ----
interface Announcement extends SyncMeta {
  typeId: string;
  templateId: string;
  logo: { kind: 'iglesia' } | { kind: 'ninguno' } | { kind: 'ministerio'; ministryId: string }; // RF-09
  themeId?: string;            // si no, el tema por defecto de la iglesia
  customPrimaryColor?: string;
  values: Record<string, unknown>; // validado contra AnnouncementTypeDef.fields (Zod)
  imageIds: string[];
  presenterNotes?: string;
  eventDate?: string;          // ISO, para archivar y sugerir
  status: 'borrador' | 'listo' | 'no_cabe';
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
}

// Valores específicos de cumpleaños, dentro de values
interface BirthdayValues {
  mode: 'individual' | 'grupo' | 'hibrido'; // por defecto 'individual' (RF-21)
  people: { name: string; day: number; month: number; photoId?: string }[];
  message?: string;
  verse?: string;
}

interface Ministry extends SyncMeta {
  name: string;                // 'Iglesia', 'Sociedad de Jóvenes', 'Ministerio de la Mujer'...
  isChurch: boolean;           // el ministerio raíz = la iglesia local
  logos: LogoVariant[];
}

interface LogoVariant {
  imageId: string;
  color: 'color' | 'blanco' | 'negro';
  orientation: 'horizontal' | 'vertical' | 'cuadrado';
}

interface ImageAsset extends SyncMeta {
  storagePath: string;         // ruta en el almacenamiento en la nube
  hash: string;                // SHA-256 del contenido, para evitar duplicados
  width: number;
  height: number;
  kind: 'foto' | 'flyer' | 'logo' | 'asset';
  // El Blob vive solo en la caché local (IndexedDB), no en la tabla
}

interface Presentation extends SyncMeta {
  date: string;                // ISO (normalmente un sábado)
  items: { announcementId: string }[]; // el orden del array es el orden de proyección
  showCover: boolean;
  showClosing: boolean;
  published: boolean;          // habilita la vista de lectura pública
  readingSlug?: string;        // identificador del enlace (≥ 16 caracteres aleatorios, RF-75)
}

interface Theme extends SyncMeta {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  fontFamily: string;          // en el MVP siempre 'Atkinson Hyperlegible' (token para F2)
}

interface Settings extends SyncMeta {
  churchName: string;
  defaultThemeId: string;
  currency: string;            // 'DOP'
  timeFormat: '12h' | '24h';
  birthdayDefaultMessage: string;
  coverTitle: string;
}
```

**Contrato de plantilla:**

```ts
interface TemplateDef {
  id: string;
  name: string;
  typeIds: string[];
  slots: SlotDef[];            // cajas de texto, imagen y logo, con min/max de fuente
  component: Component;        // componente Vue que renderiza una slide de 1920×1080
  layout: (data: NormalizedData) => SlideSpec[]; // normalmente 1; varios solo en cumpleaños
}
```

---

## 8. Arquitectura

### 8.1 Stack

| Aspecto | Decisión | Justificación breve |
|---|---|---|
| Framework | **Vue 3** (Composition API, `<script setup>`) | Reactividad profunda ideal para formularios con vista previa en vivo, y es el framework que domina el responsable. |
| Build | **Vite** | Estándar, rápido y con un buen plugin de PWA. |
| Lenguaje | **TypeScript** estricto | Los tipos declarativos de anuncio y plantilla se benefician mucho. |
| Estado | **Pinia** (mínimo) | El estado de la UI y de la sesión. Los datos viven en Dexie. |
| Validación | **Zod** | Valida `values` contra la definición del tipo. |
| Persistencia local | **Dexie** (IndexedDB) | Guarda Blobs, tiene migraciones versionadas y consultas reactivas (`liveQuery`). |
| Backend | **Supabase** (plan gratuito): Postgres, Auth y Storage | Ver §8.4 y §8.5. |
| Offline / PWA | **vite-plugin-pwa** (Workbox) | Precache del bundle y caché de las imágenes. |
| Ordenar la cola | **vue-draggable-plus** (SortableJS) | Con alternativa por botones. |
| Íconos | **Lucide** (`lucide-vue-next`) | SVG empaquetado. |
| Fuente | `@fontsource/atkinson-hyperlegible` | Local. |
| Estilos de la app | Tailwind CSS (opcional) | Solo para la interfaz de la app. |
| Estilos de las slides | CSS con **variables** (tokens de tema) y CSS con alcance por plantilla | Las plantillas deben ser autocontenidas y tematizables. |
| Pruebas | **Vitest** + **Playwright** | |
| F2 | `moveable` (núcleo agnóstico, con una envoltura propia) · `@huggingface/transformers` + RMBG-1.4 (quitar fondo) · `modern-screenshot` + `jsPDF` | |
| F3 | `pptxgenjs` | |

**Descartados:** Next.js y Nuxt (aportan servidor y SSR, que no se necesitan en un SPA offline sobre hosting estático); Svelte (menor dominio del responsable y riesgo de mezcla de sintaxis Svelte 4/5 en el código generado); Firebase (Cloud Storage exige el plan de pago Blaze desde febrero de 2026).

### 8.2 Renderizado de slides

- Cada slide es un componente Vue que dibuja en un lienzo fijo de 1920×1080. Se escala con `transform: scale()` al contenedor (vista previa, miniaturas, ventana pública).
- El **mismo componente** se usa en la vista previa, las miniaturas, la ventana pública y (en F2) la exportación a imagen. Una sola fuente de verdad visual.
- El ajuste de texto (§5.6) es una utilidad propia (composable) que mide el DOM; sin dependencias pesadas.

### 8.3 Ventanas de presentación

- La vista del presentador abre la ventana pública con `window.open` (misma app, ruta `/publica`).
- La comunicación se hace con `BroadcastChannel('presentacion')`. Mensajes: `goto(index)`, `black(on)`, `logo(on)`, `state` (estado completo al reconectar).
- La ventana pública es "tonta": recibe el índice y renderiza. Lee los datos de Dexie (no de la red).

### 8.4 Persistencia local-first y sincronización

- **Fuente de verdad para la UI:** Dexie (IndexedDB). Toda escritura va primero a Dexie y a una **cola de salida** (outbox).
- **Sincronizador:** cuando hay conexión, envía la cola a Supabase y luego descarga los cambios con `updated_at > última_sincronización`.
- **Conflictos:** gana el registro con el `updated_at` más reciente según el servidor (*last-write-wins* por registro). Es suficiente porque la concurrencia es baja (1 a 3 editores).
- **Borrado lógico** (`deleted_at`) para que los borrados se propaguen.
- **Imágenes:** se comprimen en el cliente y se suben a Supabase Storage con la ruta basada en su hash (evita duplicados). La copia local (Blob) se mantiene en Dexie para el uso offline.
- **Pausa del plan gratuito:** Supabase pausa los proyectos gratuitos tras 7 días sin actividad. Mitigaciones: (1) la app es local-first, así que la presentación del sábado no depende del backend; (2) un **workflow programado de GitHub Actions** hace una consulta ligera cada 3 días para mantener el proyecto activo; (3) la app detecta el backend pausado y muestra un aviso claro sin bloquear.
- **Límites del plan gratuito a vigilar:** 500 MB de base de datos y 1 GB de almacenamiento. Con imágenes comprimidas (~150–300 KB) alcanza para miles de imágenes. Mostrar en Configuración el espacio usado y ofrecer limpiar las imágenes de anuncios pasados.

### 8.5 Autenticación y permisos

- **Supabase Auth** con correo y contraseña para los **editores**: cuentas personales y cuentas compartidas de equipo (RF-113). Sin roles distintos en el MVP. Registro público desactivado: las cuentas se crean o se invitan desde el panel de Supabase.
- **RLS:** usuarios autenticados → lectura y escritura de todas las tablas de la iglesia (una sola iglesia por instalación en el MVP).
- **Vista de lectura pública:** función RPC `get_reading_view(slug)` (`security definer`) que devuelve solo la presentación **publicada** con ese slug y los campos públicos de sus anuncios, **nunca** las notas del presentador. Con sesión iniciada, la app lee las tablas directamente e incluye las notas (RF-74). Las imágenes de la vista de lectura se sirven desde un bucket de lectura pública con rutas basadas en hash (no adivinables).
- **Presentar:** no requiere sesión si los datos ya están preparados en el dispositivo (RF-55).

### 8.6 Despliegue en Hostinger

- Se despliega en un **subdominio propio** (por ejemplo, `anuncios.dominio.com`), en la raíz del subdominio (`base: '/'` en Vite).
- `npm run build` genera `dist/`, que se sube por **FTP** a la carpeta del subdominio, igual que en los otros proyectos del responsable.
- **HTTPS obligatorio** (el Service Worker no funciona sin él). Activar el SSL gratuito de Hostinger para el subdominio.
- **`.htaccess`** (Apache/LiteSpeed):
  - Fallback de rutas del SPA a `index.html`.
  - `Cache-Control: no-cache` para `index.html`, `sw.js` y `manifest.webmanifest`.
  - Caché larga (`max-age=31536000, immutable`) para los archivos con hash en `assets/`.
- Despliegue: script `npm run deploy` (build + subida por FTP) o un workflow de GitHub Actions que haga lo mismo al hacer push a `main`. Credenciales FTP solo en secretos de GitHub o en un `.env` local ignorado por git, **nunca** en el repositorio.
- Al desplegar, eliminar los archivos viejos de `assets/` en el servidor (subida en modo sincronización) para no acumular versiones.
- Variables públicas: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

### 8.7 Estructura de carpetas sugerida

```
src/
  app/                 # rutas/pantallas (vue-router)
  components/          # UI general
  slides/
    engine/            # escalado, ajuste de texto, contraste, selección de logo
    templates/         # una carpeta por plantilla (componente + definición)
    types/             # definiciones declarativas de tipos de anuncio
  presentation/        # presentador, ventana pública, canal de sincronización
  reading/             # vista de lectura móvil
  data/
    local/             # Dexie: esquema, repositorios
    sync/              # outbox, sincronizador, cliente Supabase
  assets/
    logos/             # logos precargados de la iglesia y los ministerios
    fonts/
  lib/                 # formato de fechas/moneda, compresión de imágenes
supabase/
  migrations/          # SQL: tablas, RLS, RPC
tests/
  unit/
  visual/
public/
  .htaccess
```

---

## 9. Diseño de plantillas (lineamientos)

- Cada tipo de anuncio tiene una **identidad visual reconocible** (color de acento e ícono), para que la congregación identifique el tipo de un vistazo.
- Jerarquía fija: **título → datos clave → secundario**. El ojo debe encontrar la fecha y el lugar en menos de 2 segundos.
- Mucho espacio en blanco.
- Plantillas del MVP:
  - **Clásica:** fondo sólido o degradado suave, título arriba, datos clave con íconos en columna y logo (si lo hay) en una esquina.
  - **Visual:** banda de color fuerte, título grande y foto en un lateral. Sin foto, el lateral usa el ícono del tipo de anuncio en grande.
  - **Cumpleaños, individual:** con foto (foto a un lado, nombre gigante al otro) y sin foto (nombre centrado ocupando la mayor parte de la pantalla). Decoración festiva discreta en los bordes.
  - **Cumpleaños, grupo:** tarjetas del mismo tamaño, con foto y nombre o solo con el nombre grande, ordenadas por día; o solo nombres en columnas si nadie tiene foto.
  - **Slide de imagen:** imagen contenida con fondo difuminado.
  - **Portada y cierre:** logo de la iglesia grande y el título.
- Las fotos de personas (PNG sin fondo) se apoyan en el borde inferior, sin tapar el texto.

---

## 10. Criterios de aceptación del MVP

1. Con la laptop **sin internet**, tras usar "Preparar sin internet", se puede abrir la app, **crear y editar** anuncios y **presentar** con la vista del presentador y la ventana pública.
2. En **Chrome y Brave** sobre Windows, en modo extendido, la ventana pública no muestra **ningún** control y la vista del presentador controla: siguiente, anterior, saltar a una slide y pantalla negra.
3. El modo de una sola ventana (respaldo) funciona con teclado y clicker.
4. Cada tipo del MVP tiene 2 plantillas, y la vista previa se actualiza en vivo.
5. Un anuncio cuyo texto no cabe se marca como "No cabe", señala el campo y no puede agregarse a la presentación.
6. Cumpleaños: "uno por slide" es el modo por defecto, y sin foto el nombre ocupa el centro sin ningún avatar. En modo "grupo" se admiten fotos mezcladas y se reparte si no caben. En modo "híbrido", quienes tienen foto salen solos y el resto agrupado.
7. El logo de la iglesia aparece por defecto en la variante correcta según el fondo. Con "ninguno", la slide no deja hueco.
8. Un flyer vertical se muestra completo con relleno difuminado.
9. Un color personalizado de bajo contraste (por ejemplo, amarillo claro) produce de todas formas texto con contraste ≥ 7:1.
10. Un anuncio creado en el celular aparece en la laptop tras sincronizar. Las ediciones hechas sin conexión se sincronizan al volver la red.
11. La vista de lectura pública abre en el celular desde el enlace, nunca muestra las notas del presentador (un editor con sesión sí las ve) y sigue disponible sin conexión después de abrirse una vez.
12. La app desplegada por FTP en el subdominio de Hostinger funciona con HTTPS, rutas profundas (recargar en `/presentacion/...`) y actualizaciones del Service Worker.
13. Todas las pruebas de §5.7 pasan.

---

## 11. Plan por fases

### Fase 1 — MVP

1. Montar el proyecto: Vite, Vue, TS, PWA, Dexie, fuente local, Vitest, Playwright y `.htaccess`.
2. Motor: lienzo escalado, contraste, ajuste de texto, selección de variante de logo, con sus pruebas.
3. Definiciones declarativas de los tipos y ministerios, con los logos precargados.
4. Plantillas Clásica y Visual, de cumpleaños (individual y grupo), de imagen, y la portada y el cierre.
5. Formularios por tipo con vista previa en vivo y el estado "No cabe".
6. Presentaciones: crear, sugerir anuncios, ordenar y "Preparar sin internet".
7. Vista del presentador y ventana pública con `BroadcastChannel`; modo de una sola ventana.
8. Supabase: esquema, RLS, Auth, Storage, sincronizador local-first y workflow para mantener el proyecto activo.
9. Vista de lectura móvil con la función RPC y la caché offline.
10. Configuración, respaldo zip y almacenamiento persistente.
11. Despliegue en Hostinger y **prueba real** en la iglesia (laptop sin internet + pantallas).

> Recomendación de orden: completar los pasos 1–7 **solo en local** (sin backend) y validarlos en la iglesia. Luego agregar los pasos 8–9. Así lo crítico (generar y presentar) se valida antes y la sincronización se agrega sobre una base estable.

### Fase 2
Galería de assets con slots y ajuste limitado · Quitar fondo en el navegador · Catálogo de fuentes por plantilla · Modo bucle · Exportar PDF/PNG · Registro de miembros para cumpleaños · Tipo Recaudación/Venta · Posible división de anuncios en 2 slides.

### Fase 3
Exportar a .pptx · Más plantillas · Soporte para varias iglesias, si llegara a hacer falta.

---

## 12. Fuera de alcance

- Cualquier uso de IA (generación de texto, imágenes o diseño).
- Un editor libre estilo Canva o PowerPoint.
- Video y animaciones complejas.
- Anuncios de más de una slide en el MVP (salvo cumpleaños, portada y cierre).
- Cumpleañeros de un mes completo en el MVP.
- Controlar la presentación desde el celular (requeriría red local o internet en la iglesia).
- Un servidor propio o servicios de pago.
- Una base de datos de versículos bíblicos (el usuario escribe el versículo).

---

## 13. Decisiones confirmadas y preguntas abiertas

### 13.1 Decisiones confirmadas por el responsable

| # | Tema | Decisión |
|---|---|---|
| 1 | Pantallas | La laptop se usa en **modo extendido**. |
| 2 | Equipo | **Windows** con **Chrome o Brave**. Por ahora es siempre la misma laptop. |
| 3 | Logos | El principal es el de la **iglesia local** (con varias variantes). Los demás se agregan a medida que avance el proyecto. |
| 4 | Logo por anuncio | Normalmente el de la **iglesia local** o **ninguno**. Ocasionalmente el de un ministerio. |
| 5–6 | Cumpleaños | Modos **uno por slide (por defecto)**, **grupo** e **híbrido**. En grupo se admiten fotos mezcladas y se reparte si no caben. |
| 7 | Cuentas | **Una por persona**, más posibles **cuentas compartidas de equipo** (Comunicaciones, Audiovisuales). |
| 8 | Vista de lectura | **Pública**, para toda la congregación, sin notas del presentador. |
| 9 | Hosting | **Subdominio propio** en Hostinger, despliegue por **FTP**. |
| 10 | Colores | No son prioritarios. Tema neutro por defecto, configurable. |
| 11 | Clicker | Algunas personas tienen. Se soportan las teclas estándar. |
| 12 | Licencia | **Código abierto, MIT.** El modelo para quitar fondo (RMBG-1.4) se usa bajo su licencia no comercial, separado del código (§3.11). |

### 13.2 Preguntas abiertas

| # | Pregunta | Bloqueante para | Valor por defecto |
|---|---|---|---|
| A | Archivos de las **variantes del logo de la iglesia** (preferiblemente SVG o PNG transparente de alta resolución). | Paso 3 (se puede avanzar con un logo de prueba) | Logo de prueba. |
| B | Tamaño aproximado de las pantallas y distancia a la última fila. | — | Mínimos de §5, pensados para hasta ~12–15 m. |
| C | ¿Se confirma **Supabase** como backend (con la mitigación de la pausa por inactividad de §8.4)? | Paso 8 | Sí. |
| D | Nombre definitivo de la app y del subdominio. | Paso 11 | "Anuncios del Sábado". |

---

## 14. Prompt inicial sugerido para Claude Code

> Lee `SRS.md` completo. Vamos a empezar la **Fase 1 (MVP)**, primero con los pasos 1 a 7 en modo **solo local** (sin backend), como recomienda §11. Las decisiones de §13.1 ya están confirmadas; de §13.2, pregúntame solo lo que bloquee esos pasos. Luego propón un plan de tareas y espera mi aprobación. Respeta estrictamente las restricciones de §2.4 y las reglas de legibilidad de §5: presentar debe funcionar 100% offline y nunca se renderiza texto por debajo de los mínimos. Empieza por el motor (lienzo, contraste, ajuste de texto y selección de logo) con sus pruebas, antes de las plantillas.
