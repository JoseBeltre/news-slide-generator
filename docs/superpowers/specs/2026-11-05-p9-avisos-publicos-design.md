# P9 · Avisos públicos para la congregación — diseño

Fecha: 2026-11-05 · SRS §11 paso 9 (RF-70…75, §8.5), con cambios del responsable.

## Qué se construye

Una **página pública fija**, `https://anunciosm2.jose-web.com/anuncios/publico`, con los **avisos vigentes** de la iglesia en texto, para el celular. El enlace se comparte una vez en el grupo de WhatsApp y nunca cambia: siempre muestra lo último sincronizado. Se ve sin iniciar sesión, funciona sin internet si se abrió una vez, y al compartirla aparece la imagen "A".

### Cambios frente al SRS (decididos por el responsable)

- **Una página fija, no un enlace por presentación** (RF-72, RF-75): no se publica nada. `Presentation.published` y `readingSlug` quedan sin usar; no se borran, para no romper la sincronización.
- **Contenido: anuncios vigentes**, no la presentación del sábado (RF-70).
- **Casilla "Mostrar al público"** por anuncio (nueva).
- **Los cumpleaños nunca aparecen**: los nombres y las fechas de cumpleaños de los miembros no salen en internet.
- **Sin notas para editores con sesión** (RF-74 queda fuera): la página nunca tiene sesión; las notas ya están en la vista del presentador.
- **Bots:** Google y Bing pueden indexarla; los bots de IA quedan bloqueados.

## 1. Datos

- `Announcement.showPublic?: boolean`, donde `undefined` significa visible, así los anuncios viejos se ven. Lo guarda el editor; viaja en `data` como el resto de los campos (sin cambiar el esquema de Dexie ni el de las tablas).
- **Migración** `supabase/migrations/20261105000000_avisos_publicos.sql`: función `public.public_notices()`, `language sql stable security definer set search_path = ''`, `grant execute` a `anon` y `authenticated`. Devuelve un `jsonb`:

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
  - **Encabezado:** "Avisos · Mansedumbre II" y "Actualizado el …", con la fecha de la última respuesta buena.
  - **Tarjetas:** una por aviso, numerada (1, 2, 3…). Lleva el título y, debajo, cada campo con contenido, con su ícono de `FieldDef.icon` y su etiqueta. Las fechas, horas y precios usan la configuración que devuelve la función.
  - **Legibilidad (RF-71):** base de 18 px CSS o más, contraste AA alto y modo oscuro con `prefers-color-scheme`.
- **Estados:**
  - **Cargando:** el esqueleto de las tarjetas.
  - **Vacío:** "No hay avisos por ahora."
  - **Sin internet, con caché:** se muestra lo guardado y una línea "Sin conexión · guardado el …".
  - **Sin internet y sin caché:** "Ábrela una vez con internet para guardarla en este celular."
  - **Error del servidor, con caché:** igual que sin internet.
  - **Error del servidor, sin caché:** "No se pudieron cargar los avisos. Prueba más tarde."
- **Caché de datos:** la última respuesta buena va a `localStorage`, en la clave `avisos-publicos:v1`. Las lecturas y escrituras van en `try/catch`.

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
  - **Lo que arma la vista previa** (`facebookexternalhit`, `WhatsApp`): `Allow: /anuncios/publico`, `Allow: /og-publico.png` y `Disallow: /`.
  - **`Google-Extended`, `Applebot-Extended` y los bots de IA de la lista:** `Disallow: /`.
  - **`*`:** `Disallow: /`.
- **Metas de `publico.html`:**
  - `robots: index, follow`;
  - `og:` y `twitter:` propios: título "Avisos · Mansedumbre II", una descripción corta, `og:image` en `https://anunciosm2.jose-web.com/og-publico.png` (1200×630), `og:url` de la página y `og:locale es_DO`;
  - `link rel=canonical`.
- **Imagen "A":** `pnpm marca` genera también `public/og-publico.png` con una plantilla nueva, `scripts/og-publico-template.html`: crema, el título en Instrument Serif, "MANSEDUMBRE II · IASD" en monoespaciada y la hoja del ícono. El archivo generado se guarda en el repositorio, como `og.png`.
- **Límites conocidos:**
  - Un bot que se haga pasar por un navegador no se puede frenar sin una clave.
  - Las respuestas con IA de Google (AI Overviews) y Copilot de Bing usan el mismo robot que el buscador, así que no se pueden separar de la indexación.
  - Cualquiera con la clave publicable, que está en el JS de la página, puede llamar a `public_notices`. Es aceptable, porque devuelve solo lo que la página muestra.

## 4. En la app

- **Editor:** casilla **"Mostrar al público"**, marcada por defecto. Va con las opciones de la slide. No sale en los cumpleaños ni en `imagen`.
- **Lista de anuncios:** si el anuncio tiene `showPublic === false`, la fila muestra la etiqueta "Oculto al público".
- **Inicio:** botón **"Compartir los avisos"**, solo si hay nube. Usa `navigator.share` y, si no está, copia el enlace al portapapeles y avisa "Enlace copiado". Al lado, un enlace "Ver" que abre la página en otra pestaña.
- **Traspaso (P10):** `showPublic` entra en `transferFileSchema` como opcional.

## 5. Pruebas

- **Unit (PGlite)** `tests/unit/db/publicNotices.test.ts`, que comprueba que:
  - un anuncio pasado, uno borrado, un borrador, un cumpleaños, una `imagen` o uno con `showPublic:false` no salen;
  - uno sin `showPublic` sí sale;
  - no aparecen `presenterNotes`, `createdBy` ni los campos de imagen;
  - el orden es por fecha, con los que no tienen fecha al final;
  - "hoy" se toma en Santo Domingo: a las 23:30 de Santo Domingo, que en UTC ya es el día siguiente, un anuncio de hoy sigue saliendo;
  - `anon` puede ejecutar la función, pero sigue sin poder leer la tabla.
- **Unit:** la función pura que convierte un aviso en filas `{icon, label, text}`, con todos los tipos y campos vacíos omitidos.
- **Browser:**
  - **La página:** tarjetas numeradas; vacío; sin red con caché y sin caché; error con caché; "Actualizado el …".
  - **El editor:** la casilla existe, no sale en cumpleaños e `imagen`, y al guardar queda `showPublic:false`.
  - **La lista:** la etiqueta "Oculto al público".
  - **Inicio:** el botón llama a `share` y, sin `share`, copia el enlace.
- **E2E:** `/anuncios/publico` con la llamada a Supabase simulada muestra los avisos. El HTML servido trae `og:image` de `og-publico.png` y `robots index`. `/` trae `noindex`.
- **Comprobación manual tras desplegar:**
  - una vista previa del enlace en WhatsApp;
  - `curl -A GPTBot` → 403;
  - `curl -A Googlebot` → 200.

## Fuera de alcance

Los íconos de ayuda con tooltip en cada campo del editor (pedido del responsable, trabajo aparte después de P9), las imágenes en la página pública, las notas para editores con sesión, la presentación del sábado como fuente y un enlace por presentación.
