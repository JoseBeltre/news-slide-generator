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

Los datos viven en el navegador de cada equipo (IndexedDB). La sincronización entre equipos y la página
de lectura para la congregación están planificadas (ver `SRS.md`, §11).

## Tecnología

Vue 3, TypeScript, Vite, Tailwind CSS v4, Dexie (IndexedDB), vue-router y vite-plugin-pwa (Workbox).
Pruebas con Vitest (unitarias y en el navegador) y Playwright (E2E contra el build, sin red).

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

## Despliegue

Cada push a `master` ejecuta `.github/workflows/deploy.yml`: typecheck, pruebas, build y E2E; si todo
pasa, sube `dist/` por FTPS a Hostinger. Necesita los secretos `FTP_HOST`, `FTP_USERNAME`,
`FTP_PASSWORD` y `FTP_SERVER_DIR`. Las otras ramas y los PR pasan las mismas comprobaciones en
`ci.yml`.

## Documentación

- `SRS.md`: requisitos y plan por fases.
- `DESIGN.md`: sistema de diseño de la interfaz (no de las slides).
- `HANDOFF.md`: estado actual, decisiones y registro de tareas.
- `docs/superpowers/plans/`: planes de implementación de cada fase.

## Licencia

MIT.
