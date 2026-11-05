# P9 · Anuncios públicos para la congregación — diseño

Fecha: 2026-11-05 · SRS §11 paso 9 (RF-70…75, §8.5), con cambios del responsable.

## Qué se construye

Una **página pública fija**, `https://anunciosm2.jose-web.com/anuncios/publico`, con los **anuncios vigentes** de la iglesia en texto, para el celular. El enlace se comparte una vez en el grupo de WhatsApp y nunca cambia: siempre muestra lo último sincronizado. Se ve sin iniciar sesión, funciona sin internet si se abrió una vez, y al compartirla aparece la imagen "A".

### Cambios frente al SRS (decididos por el responsable)

- **Una página fija, no un enlace por presentación** (RF-72, RF-75): no se publica nada. `Presentation.published` y `readingSlug` quedan sin usar; no se borran, para no romper la sincronización.
- **Contenido: anuncios vigentes**, no la presentación del sábado (RF-70).
- **Casilla "Mostrar al público"** por anuncio (nueva).
- **Los cumpleaños nunca aparecen**: los nombres y las fechas de cumpleaños de los miembros no salen en internet.
- **Sin notas para editores con sesión** (RF-74 queda fuera): la página nunca tiene sesión; las notas ya están en la vista del presentador.
- **Bots:** Google y Bing pueden indexarla; los bots de IA quedan bloqueados.

## 1. Datos

- `Announcement.showPublic?: boolean`, donde `undefined` significa visible, así los anuncios viejos se ven. Lo guarda el editor; viaja en `data` como el resto de los campos (sin cambiar el esquema de Dexie ni el de las tablas).
- **Migración** `supabase/migrations/20261105000000_anuncios_publicos.sql`: función `public.public_notices()`, `language sql stable security definer set search_path = ''`, `grant execute` a `anon` y `authenticated`. Devuelve un `jsonb`:

  ```json
  { "today": "2026-11-05",
    "settings": { "timeFormat": "12h", "currency": "DOP", "dateStyle": "…" },
    "notices": [ { "id": "…", "typeId": "culto", "values": { … }, "eventDate": "2026-11-07", "updatedAt": "…" } ] }
  ```

  - **Qué anuncios devuelve:** las filas de `announcements` que cumplen todo esto:
    - `deleted_at is null`;
    - `data->>'status' <> 'borrador'`;
    - `data->>'typeId'` fuera de `('cumpleanos','imagen')`;
    - `coalesce((data->>'showPublic')::boolean, true)`;
    - `data->>'eventDate'` nulo o `>= hoy`.
  - **Orden:** por `eventDate`, con los que no tienen fecha al final.
  - **"Hoy":** es `(now() at time zone 'America/Santo_Domingo')::date`.
  - **Qué campos salen de cada anuncio:** solo `id`, `typeId`, `values`, `eventDate` y `updatedAt`. **Nunca** `presenterNotes`, `createdBy` ni `updatedBy`.
  - **Valores:** se quitan los campos de imagen de `values`, porque la página es solo texto.
  - **Configuración:** solo esos tres campos, sacados de la fila de `settings`.
- `imagen` queda fuera porque es solo una foto, sin texto que leer.

## 2. La página `/anuncios/publico`

- **Entrada aparte de Vite:** `publico.html` más `src/public-notices/main.ts`, con su propio mini programa en Vue. Lo que importa:
  - de `src/slides/types/definitions.ts`, solo las definiciones de los campos;
  - de `src/lib/format.ts`, el formato de fechas, horas y precios;
  - un `fetch` a `${VITE_SUPABASE_URL}/rest/v1/rpc/public_notices` con la clave publicable.
- **Lo que no importa:** Dexie, el router, el editor, `@supabase/supabase-js` ni el CSS de la app. Usa Tailwind con los tokens de DESIGN.md.
- **Contenido:**
  - **Encabezado:** "Anuncios · Mansedumbre II" y "Actualizado el …", con la fecha de la última respuesta buena.
  - **Tarjetas:** una por anuncio, numerada (1, 2, 3…). Lleva el título y, debajo, cada campo con contenido, con su ícono de `FieldDef.icon` y su etiqueta. Las fechas, horas y precios usan la configuración que devuelve la función.
  - **Legibilidad (RF-71, ajustado por el responsable):** datos a 15–16 px y títulos de tarjeta a 18 px como máximo; el encabezado "Anuncios" en serif más grande. Contraste AA alto y modo oscuro con `prefers-color-scheme`.
- **Estados:**
  - **Cargando:** el esqueleto de las tarjetas.
  - **Vacío:** "No hay anuncios por ahora."
  - **Sin internet, con caché:** se muestra lo guardado y una línea "Sin conexión · guardado el …".
  - **Sin internet y sin caché:** "Ábrela una vez con internet para guardarla en este celular."
  - **Error del servidor, con caché:** igual que sin internet.
  - **Error del servidor, sin caché:** "No se pudieron cargar los anuncios. Prueba más tarde."
- **Caché de datos:** la última respuesta buena va a `localStorage`, en la clave `anuncios-publicos:v2` (la `v1` podía traer datos personales y se borra al cargar). Las lecturas y escrituras van en `try/catch`.

## 3. Sin internet, servidor e imagen "A"

- **Service Worker propio** `public/publico-sw.js`, escrito a mano, registrado con `scope: '/anuncios/publico'`:
  - **La página:** primero la red y, si falla, la caché.
  - **`/assets/*`:** primero la caché, guardando en ella lo que baja.
  - **La llamada a Supabase:** no la toca, porque la caché de datos es `localStorage`.
- **El Service Worker de la app** suma `navigateFallbackDenylist: [/^\/anuncios\/publico/]`, para no servir `index.html` en esa ruta.
- **Router de la app:** la ruta `/anuncios/publico` va antes que `/anuncios/:id` y hace una carga completa (`window.location.assign`), para no abrir el editor con el id "publico".
- **`.htaccess`:**
  - `RewriteRule ^anuncios/publico/?$ /publico.html [L]` antes del fallback del SPA.
  - **403 a los bots de IA por su User-Agent, en todo el sitio:** GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai, PerplexityBot, Perplexity-User, CCBot, Bytespider, Amazonbot, meta-externalagent, Applebot-Extended, cohere-ai, Diffbot, YouBot, DuckAssistBot, MistralAI-User, Google-CloudVertexBot.
  - **Cabecera `X-Robots-Tag`:** `noindex, nofollow` en todo el sitio, salvo `/anuncios/publico`, `publico.html` y `og-publico.png`.
- **`robots.txt`:**
  - **Googlebot y Bingbot:** `Allow: /anuncios/publico` y `Disallow: /`.
  - **Los robots de vista previa:** `Allow: /anuncios/publico`, `Allow: /og-publico.png` y `Disallow: /`. Son:
    - WhatsApp, Facebook, Instagram, Threads y Messenger (`facebookexternalhit`, `Facebot`, `WhatsApp`);
    - X/Twitter (`Twitterbot`);
    - Discord (`Discordbot`);
    - Telegram (`TelegramBot`);
    - Slack (`Slackbot-LinkExpanding`);
    - LinkedIn (`LinkedInBot`);
    - Pinterest (`Pinterestbot`);
    - Skype y Teams (`SkypeUriPreview`);
    - Viber (`Viber`).
  - **Sin robot propio:** iMessage y Signal arman la vista previa desde el mismo teléfono, así que no necesitan permiso.
  - **Facebook y Meta:** el robot de IA de Meta (`meta-externalagent`) es distinto del de vista previa y sigue bloqueado.
  - **`Google-Extended`, `Applebot-Extended` y los bots de IA de la lista:** `Disallow: /`.
  - **`*`:** `Disallow: /`.
- **Metas de `publico.html`:**
  - `robots: index, follow`;
  - `og:` y `twitter:` propios: título "Anuncios · Mansedumbre II", una descripción corta, `og:image` en `https://anunciosm2.jose-web.com/og-publico.png` (1200×630), `og:url` de la página y `og:locale es_DO`;
  - `link rel=canonical`.
- **Imagen "A":** `pnpm marca` genera también `public/og-publico.png` con una plantilla nueva, `scripts/og-publico-template.html`: crema, el título en Instrument Serif, "MANSEDUMBRE II · IASD" en monoespaciada y la hoja del ícono. El archivo generado se guarda en el repositorio, como `og.png`.
- **Límites conocidos:**
  - Un bot que se haga pasar por un navegador no se puede frenar sin una clave.
  - Las respuestas con IA de Google (AI Overviews) y Copilot de Bing usan el mismo robot que el buscador, así que no se pueden separar de la indexación.
  - Cualquiera con la clave publicable, que está en el JS de la página, puede llamar a `public_notices`. Es aceptable, porque devuelve solo lo que la página muestra.

## 4. En la app

- **Editor:** casilla **"Mostrar al público"**, marcada por defecto. Va con las opciones de la slide. No sale en los cumpleaños ni en `imagen`.
- **Lista de anuncios:** si el anuncio tiene `showPublic === false`, la fila muestra un ícono de ojo tachado junto al nombre (sin etiqueta).
- **Inicio:** botón **"Compartir los anuncios"**, solo si hay nube. Usa `navigator.share` y, si no está, copia el enlace al portapapeles y avisa "Enlace copiado". Al lado, un enlace "Ver" que abre la página en otra pestaña.
- **Traspaso (P10):** `showPublic` entra en `transferFileSchema` como opcional.

## 5. Pruebas

- **Unit (PGlite)** `tests/unit/db/publicNotices.test.ts`, que comprueba que:
  - un anuncio pasado, uno borrado, un borrador, un cumpleaños, una `imagen` o uno con `showPublic:false` no salen;
  - uno sin `showPublic` sí sale;
  - no aparecen `presenterNotes`, `createdBy` ni los campos de imagen;
  - el orden es por fecha, con los que no tienen fecha al final;
  - "hoy" se toma en Santo Domingo: a las 23:30 de Santo Domingo, que en UTC ya es el día siguiente, un anuncio de hoy sigue saliendo;
  - `anon` puede ejecutar la función, pero sigue sin poder leer la tabla.
- **Unit:** la función pura que convierte un anuncio en filas `{icon, label, text}`, con todos los tipos y campos vacíos omitidos.
- **Browser:**
  - **La página:** tarjetas numeradas; vacío; sin red con caché y sin caché; error con caché; "Actualizado el …".
  - **El editor:** la casilla existe, no sale en cumpleaños e `imagen`, y al guardar queda `showPublic:false`.
  - **La lista:** el ojo tachado en la fila del anuncio oculto.
  - **Inicio:** el botón llama a `share` y, sin `share`, copia el enlace.
- **E2E:** `/anuncios/publico` con la llamada a Supabase simulada muestra los anuncios. El HTML servido trae `og:image` de `og-publico.png` y `robots index`. `/` trae `noindex`.
- **Comprobación manual tras desplegar:**
  - una vista previa del enlace en WhatsApp;
  - `curl -A GPTBot` → 403;
  - `curl -A Googlebot` → 200.

## Fuera de alcance

Los íconos de ayuda con tooltip en cada campo del editor (pedido del responsable, trabajo aparte después de P9), las imágenes en la página pública, las notas para editores con sesión, la presentación del sábado como fuente y un enlace por presentación.

## 6. Cambios tras la revisión (2026-11-05): privacidad, interruptor y migraciones

El responsable frenó la publicación: **ningún dato personal (PII) sale en la página pública**. No hay autorización para publicar nombres ni contactos personales.

### 6.1 Campos con audiencia

- **Atributos nuevos en `FieldDef`:**
  - **`audience?: 'slides'`:** el campo se proyecta, pero nunca sale en la página pública.
  - **`fallbackFor?: string`:** el campo sale en la slide solo si el campo que nombra está vacío.
- **Nombres:**
  - `predicador` y `fotoPredicador` (Culto) llevan `audience: 'slides'`.
  - Los Cumpleaños ya estaban fuera.
- **Contacto, en dos campos** (Salida, Obra misionera, Actividad y Aviso):
  - **`contacto` (privado):**
    - **Etiqueta:** "Contacto privado".
    - **Ayuda:** "Sale en las slides. Nunca en la página pública."
    - **Audiencia:** `audience: 'slides'`.
    - **Datos viejos:** los contactos que ya existen quedan como privados.
  - **`contactoPublico` (público):**
    - **Etiqueta:** "Contacto público".
    - **Ejemplo:** "Habla con el Director de Jóvenes".
    - **Ayuda:** "Sale en la página pública, y en la slide si no hay contacto privado."
    - **Atributos:** `fallbackFor: 'contacto'`, con el ícono y el largo del privado.
- **Slides:** `normalizeAnnouncement` omite un campo con `fallbackFor` si el campo nombrado tiene valor. Es genérico, no hay código por tipo (RNF-08).
- **Página pública:** las tarjetas omiten los campos con `audience: 'slides'`, sin importar `fallbackFor`.
- **Servidor:** una migración nueva reemplaza `_public_notices_at` y quita de `values` las claves con `audience: 'slides'` y las de imagen (`predicador`, `fotoPredicador`, `contacto`). Una prueba deriva esa lista de las definiciones, así que un campo nuevo con audiencia la hace fallar.

### 6.2 Aviso en el editor

Bajo la casilla "Mostrar al público", en lugar de la línea actual, va este aviso: "Sale en la página que se comparte con la congregación. No escribas nombres ni teléfonos de personas." Aplica a los campos de texto libre (título, descripción, mensaje y lugar), que el sistema no puede revisar.

### 6.3 Interruptor en Configuración

- **Sección "Página pública"** en `/configuracion`, con dos opciones:
  - **"Para todos"** (por defecto): la página funciona como hasta ahora.
  - **"Solo el equipo"**: nadie ve los anuncios en la página.
- **Campo nuevo:** `Settings.publicPage: 'todos' | 'equipo'`.
- **Respuesta del servidor:** `public_notices()` devuelve `{ enabled: false, notices: [] }` si está en `'equipo'`.
- **Mensaje de la página apagada:** "Los anuncios no están disponibles por ahora." Además se borra la copia guardada en el celular.
- **En Inicio:** con la página apagada, la línea de compartir no aparece.

### 6.4 Migraciones automáticas

- **En `deploy.yml`:**
  - **Orden:** después de las pruebas y antes de subir por FTP. Si la migración falla, no se publica nada.
  - **Herramienta:** se instala la CLI de Supabase (`supabase/setup-cli`).
  - **Secretos:** `SUPABASE_ACCESS_TOKEN` y `SUPABASE_DB_PASSWORD`, que los crea el responsable.
  - **Proyecto:** la referencia va como variable (`SUPABASE_PROJECT_REF`, `jyxhnqbqzqrbahorigxq`) y el paso hace `supabase link --project-ref $SUPABASE_PROJECT_REF`.
- **Migraciones ya aplicadas:** el responsable aplicó a mano `20261103000000` y `20261105000000`, así que antes de `supabase db push` el paso marca esas dos versiones con `supabase migration repair --status applied`. Si la versión ya está registrada, no cambia nada.
- **Si faltan los secretos:** el paso falla con un mensaje claro, como ya hace con FTP.

### 6.5 Vista del equipo (decidida por el responsable, 2026-11-05)

- **Qué es:** la misma página `/anuncios/publico`, abierta en un celular con la sesión del equipo iniciada en la app, muestra también los datos que solo van en las slides: el predicador y el contacto privado. Sin sesión (congregación, Google, bots) no cambia nada.
- **Servidor:** función nueva `public.team_notices()`, solo para `authenticated`. Si `public.is_editor()` es falso, lanza un error. Devuelve la misma forma que `public_notices()`, sin quitar `predicador` ni `contacto` (la foto sigue fuera: vive en el almacenamiento privado), y no mira el interruptor de §6.3: con "Solo el equipo", el equipo sigue viendo sus anuncios.
- **Página:** lee la sesión que la app guarda en este mismo dominio (`localStorage`, clave `sb-<ref>-auth-token`, con `access_token` y `expires_at`). Sin sesión, con la sesión vencida o si `team_notices()` falla, usa la vista pública. No renueva la sesión: al abrir la app se renueva sola. La página no carga la librería de Supabase.
- **Copia sin internet:** la del equipo va en otra clave (`anuncios-equipo:v1`) y nunca se mezcla con la pública. La vista pública sin sesión nunca lee la del equipo.
- **Marca (mockup aprobado `mockup-p9-equipo`):** una franja naranja bajo el encabezado, con un candado: "**Vista del equipo.** Incluye nombres y contactos privados. No compartas capturas de esta pantalla."
- **Tarjetas:** con los campos de `audience: 'slides'` y con el contacto público también, aunque haya privado.
