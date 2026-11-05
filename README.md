# Anuncios del Sábado

App web para preparar y proyectar los anuncios del sábado de la Iglesia Adventista **Mansedumbre II**.
El equipo de comunicaciones llena un formulario por anuncio, la app arma las slides 16:9 con un diseño
cuidado y legible desde el fondo del templo, y el sábado se presentan en las pantallas desde una laptop,
**también sin internet**.

Publicada en **https://anunciosm2.jose-web.com**. Es una PWA: se instala en la laptop o el móvil y
funciona sin conexión después de abrirla una vez con internet.

## Qué hace

- **Anuncios por tipo:** culto o programa, salida, obra misionera, cumpleaños (de una persona o de un
  grupo), actividad, aviso e imagen (un flyer que se proyecta tal cual). Cada tipo tiene su formulario,
  con vista previa en vivo y un aviso si el texto no cabe en la slide.
- **Diseño de las slides:** tres estilos (Himnario, Almanaque y Cartel), temas de color, fechas largas o
  cortas ("ESTA NOCHE", "MAÑANA") y los logos de la iglesia y de cada ministerio, que eligen solos la
  variante clara u oscura según el fondo.
- **Presentaciones:** la presentación del sábado se crea con los anuncios sugeridos para esa fecha, se
  ordena arrastrando y lleva portada y cierre con su propio título y estilo. "Preparar sin internet"
  comprueba que todo (imágenes, logos, letras y la propia app) esté guardado en el equipo.
- **Presentar:** con dos pantallas, la del presentador muestra la slide actual y la siguiente, los puntos
  clave, las notas y las miniaturas; la ventana pública solo muestra las slides. Funciona con teclado o
  clicker, con pantalla en negro (B) y logo (L) para las pausas. También hay un modo de una sola ventana.

- **Sincronización:** lo que prepara cada persona del equipo (en su PC o su celular) llega a los demás
  equipos. Se entra con el correo y un código de 6 dígitos, sin contraseña; cualquier editor añade o quita
  correos en **Equipo**. Los datos viven primero en el navegador (IndexedDB) y la nube solo sincroniza:
  sin internet se crea, edita y presenta igual. Si dos personas editan lo mismo, gana la edición más
  reciente.
- **Configuración:** el estilo, el tema, la fecha, la hora y la moneda con que nacen los anuncios; el
  título de la portada y el mensaje de cumpleaños por defecto; el **Equipo**; y el espacio usado en este
  equipo y en la nube, con "Proteger los datos" para que el navegador no los borre.
- **Exportar e importar:** un anuncio o una presentación se exporta a un `.zip` (con sus imágenes) para
  pasarlo a otro equipo sin la nube. Al importar se revisa todo: lo que ya está en el equipo se importa
  como copia (con "(2)", "(3)"…) o se sobrescribe, en una presentación se eligen sus anuncios, y si la
  fecha ya tiene otra presentación se pide otra. Los ministerios no viajan: se usan los precargados.

- **Anuncios públicos:** `/anuncios/publico` es una página fija para la congregación (el enlace se
  comparte una vez en el grupo de WhatsApp) con los anuncios vigentes en texto, también sin internet si se
  abrió una vez. Cada anuncio tiene la casilla "Mostrar al público"; los cumpleaños y las slides de imagen
  nunca salen, ni las notas del presentador. En Inicio, "Compartir los anuncios" y "Ver". Google y Bing la
  pueden indexar; los bots de IA quedan bloqueados (`public/robots.txt` y `.htaccess`). Necesita la
  migración `supabase/migrations/20261105000000_anuncios_publicos.sql` aplicada en Supabase.

## Tecnología

Vue 3, TypeScript, Vite, Tailwind CSS v4, Dexie (IndexedDB), vue-router y vite-plugin-pwa (Workbox).
Nube: Supabase (Postgres con RLS, Auth por código de correo y Storage), plan gratuito.
Pruebas con Vitest (unitarias, en el navegador y SQL con PGlite) y Playwright (E2E contra el build, sin red).

## Desarrollo

Requiere Node 24 y pnpm.

```bash
pnpm install
pnpm dev          # servidor de desarrollo (sin Service Worker)
pnpm test         # pruebas unitarias y de navegador
pnpm test:e2e     # E2E contra el build de producción
pnpm build        # typecheck y build en dist/
pnpm preview      # sirve el build en http://localhost:4173
pnpm marca        # regenera iconos e imagen para compartir desde public/icon*.svg
```

Para probar el modo sin internet hay que usar `pnpm build` y `pnpm preview` (o el sitio publicado): en
`pnpm dev` no hay Service Worker.

## Sincronización (Supabase)

Opcional: sin las variables la app funciona igual, solo que sin sincronizar.

1. Copia `.env.example` a `.env.local` y pon la URL y la clave pública del proyecto.
2. El esquema está en `supabase/migrations/`. El primer editor se añade con SQL directo
   (`insert into public.editors (email) values ('tu@correo')`), nunca en una migración.
3. En el panel de Supabase: SMTP propio (si no, el código solo llega a los miembros de la organización),
   plantilla "Magic Link" con `{{ .Token }}` y el hook `before_user_created` activado.
4. `keep-alive.yml` llama cada 3 días a `ping()` para que el plan gratuito no se pause.

## Despliegue

Cada push a `master` ejecuta `.github/workflows/deploy.yml`: typecheck, pruebas, build y E2E; si todo
pasa, sube `dist/` por FTPS a Hostinger. Necesita los secretos `FTP_HOST`, `FTP_USERNAME`,
`FTP_PASSWORD` y `FTP_SERVER_DIR`, y las *variables* `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`
para el build publicado. Las otras ramas y los PR pasan las mismas comprobaciones en
`ci.yml`.

Antes de subir, el mismo workflow aplica las migraciones nuevas de `supabase/migrations/` con la CLI
de Supabase (`supabase db push`); si fallan, no se publica nada. Necesita dos secretos más, que crea
el responsable con la cuenta de la iglesia:

- `SUPABASE_ACCESS_TOKEN`: un token personal de supabase.com/dashboard/account/tokens.
- `SUPABASE_DB_PASSWORD`: la contraseña de la base (Project Settings → Database; si nadie la tiene,
  se puede restablecer ahí).

La variable `SUPABASE_PROJECT_REF` es opcional (por defecto, el proyecto de la iglesia).

## Documentación

- `SRS.md`: requisitos y plan por fases.
- `DESIGN.md`: sistema de diseño de la interfaz (no de las slides).
- `HANDOFF.md`: estado actual, decisiones y registro de tareas.
- `docs/superpowers/plans/`: planes de implementación de cada fase.

## Licencia

MIT.
