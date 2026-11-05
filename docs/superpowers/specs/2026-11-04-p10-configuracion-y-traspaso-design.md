# P10 · Configuración y exportar/importar — diseño

**Fecha:** 2026-11-04 · **SRS:** §11 paso 10, RF-102, RF-111, RF-112, RF-113 (equipo), parte de RF-110 (estilo y tema) · **Estado:** aprobado en conversación

## Objetivo

Que el equipo pueda ajustar los valores con que nacen anuncios y presentaciones, gestionar quién entra,
ver el espacio usado, y pasar un anuncio o una presentación de un equipo a otro con un archivo.

## Decisiones tomadas con el responsable

| Tema | Decisión |
|---|---|
| Alcance de Configuración | Valores por defecto (estilo, tema, fecha, hora, moneda), textos por defecto, Equipo y Almacenamiento. |
| Fuera por ahora | Nombre de la iglesia, ministerios y logos (resto de RF-110). |
| Respaldo | **Sin respaldo completo** (RF-103 queda para más adelante). Se exporta **un anuncio o una presentación**. |
| Importar | Pantalla de revisión: lo nuevo entra tal cual; lo que ya existe → **"Importar como copia"** (por defecto, título con "(2)", "(3)"…) o **"Sobrescribir"**; en una presentación se eligen sus anuncios. |

## 1. Página Configuración

- Ruta `/configuracion` (`name: 'configuracion'`), enlace **"Configuración"** con icono de engranaje al final
  de la navegación de `AppHeader`. `/equipo` redirige a `/configuracion#equipo`.
- Una sola página con índice arriba (enlaces a las secciones) y cuatro secciones, cada una un componente:
  1. **Presentaciones y slides** (`#slides`): estilo de slide (`StylePicker`), tema de color, formato de fecha
     (`dateStyle` largo/corto y `relativeDates`), formato de hora (`timeFormat`), moneda (`currency`: `DOP` → "RD$",
     `USD` → "US$").
  2. **Textos por defecto** (`#textos`): título de la portada (`coverTitle`) y mensaje de cumpleaños
     (`birthdayDefaultMessage`). Vacío no se guarda: se vuelve al valor por defecto.
  3. **Equipo** (`#equipo`): el contenido actual de `TeamPage` (lista, añadir, quitar, cerrar sesión) como
     sección. Sin sesión: "Entrar" (`/entrar?volver=/configuracion`). Sin nube configurada no se muestra.
  4. **Almacenamiento** (`#almacenamiento`):
     - En este equipo: `navigator.storage.estimate()` (usado) y `navigator.storage.persisted()`. Si no está
       protegido, botón **"Proteger los datos"** → `persist()` (RF-102), con el resultado en texto.
     - En la nube (solo con sesión): suma de `metadata.size` de los objetos del bucket `images`, sobre 1 GB.
       Si falla: "No se pudo consultar".
- Guardado: cada cambio se guarda al momento en `settings` (registro `configuracion`) con el repositorio, por lo
  que entra en `outbox` y se sincroniza. Sin botón "Guardar".
- Efecto: solo en lo **nuevo** y en lo que no tiene valor propio (las portadas sin `slideStyle` propio, los
  anuncios que siguen el estilo de Configuración).
- La página cumple los límites de la prueba de arquitectura (página ≤ 80 líneas; la lógica en composables).

## 2. Exportar

- **Anuncio:** acción "Exportar" en `AnnouncementRow` (lista) y en el editor. **Presentación:** botón
  "Exportar" en `PresentationPage`.
- Archivo `.zip` (librería `fflate`):
  - `contenido.json`:
    ```ts
    interface TransferFile {
      formato: 'anuncios-del-sabado'
      version: 1
      tipo: 'anuncio' | 'presentacion'
      exportadoEn: string            // ISO
      presentation?: Presentation    // solo si tipo = 'presentacion'
      announcements: Announcement[]  // el anuncio, o los de la presentación (vivos, en su orden)
      images: ImageAsset[]           // las que usan esos anuncios
    }
    ```
  - `imagenes/<hash>.<ext>`: el archivo de cada imagen (el Blob local). Si falta el Blob, se exporta igual y la
    revisión lo avisa ("Falta una imagen").
- Nombre: `anuncio-<titulo-en-slug>.zip` (sin título: `anuncio-<tipo>.zip`) y `presentacion-<YYYY-MM-DD>.zip`.
- Se descarga con un enlace temporal (`URL.createObjectURL`), sin red.

## 3. Importar

- Botón **"Importar"** en las páginas Anuncios y Presentaciones → elegir archivo → ruta `/importar` con la
  revisión (el archivo leído se guarda en memoria, no en Dexie; recargar la página vuelve a pedirlo).
- **Lectura:** `fflate` descomprime; se valida `formato`, `version` y la forma con Zod. Si no cuadra: "Este
  archivo no es una exportación de Anuncios del Sábado." y no se toca nada.
- **Revisión** (estado puro calculado contra Dexie, `planImport`):
  - Anuncio: una fila con título y tipo. Presentación: su fecha y debajo sus anuncios con casilla (todos
    marcados).
  - Cada elemento (anuncio o presentación) cuyo `id` ya existe vivo en este equipo: etiqueta "Ya está en este
    equipo" y elección **Importar como copia** (por defecto) o **Sobrescribir**. Si no existe: entra tal cual.
  - Copia de anuncio: id nuevo; el título (`values.titulo` o, si no, `values.tituloInterno`) recibe el primer
    sufijo libre " (2)", " (3)"… entre los títulos vivos del equipo. Sin esos campos (imagen, cumpleaños) se
    copia sin cambiar el nombre.
  - Copia de presentación: id nuevo. Si ya hay una presentación viva en esa fecha (copia o importación nueva),
    la revisión pide **otra fecha** y no deja confirmar hasta elegir una libre.
  - Desmarcar un anuncio lo excluye y lo quita de los `items` de la presentación importada.
- **Aplicar** (`applyImport`), en una sola transacción Dexie que incluye `db.outbox`:
  - Imágenes: por cada imagen usada, si existe una con el mismo `hash` se reutiliza su id; si no, se guarda
    el registro y su Blob (id del archivo). Los `imageIds` de los anuncios se remapean. Los ministerios no viajan:
    son los precargados (ids fijos); un logo de un ministerio que no exista en este equipo se ignora al dibujar,
    como hoy.
  - Anuncios y presentación: copia → id nuevo y `items` remapeados; sobrescribir o nuevo → mismo id. Todo con
    `updatedAt` = ahora, vía repositorio (entra en `outbox`).
  - Error a mitad → no queda nada (la transacción se revierte) y se muestra el error.
- Al terminar: abre lo importado (la presentación o el anuncio) y muestra "Se importaron N anuncios y 1
  presentación".

## 4. Código

- `src/data/settingsActions.ts` (o en `settings.ts`): `saveSettings(db, patch)`.
- `src/data/transfer/`: `format.ts` (tipos + esquema Zod + `TRANSFER_FORMAT`), `pack.ts`
  (`exportAnnouncement`, `exportPresentation` → `{ name, blob }`), `unpack.ts` (`readTransferFile(file)`),
  `plan.ts` (`planImport`, `copyTitle`), `apply.ts` (`applyImport`).
- `src/features/settings/`: `SettingsPage.vue` + secciones (`SlidesSection`, `TextsSection`, `TeamSection`,
  `StorageSection`) y composables. `TeamPage`/`useTeam` se reutilizan como sección.
- `src/features/transfer/`: `ImportButton.vue`, `ImportPage.vue`, `ImportItem.vue`, `useImport.ts`, `useExport.ts`.
- Dependencia nueva: `fflate`.

## 5. Pruebas

- `transfer`: exportar y volver a importar un anuncio y una presentación sin pérdida (en otro `AppDb`); copia
  con "(2)" y "(3)"; anuncio sin título copiado sin cambio de nombre; sobrescribir conserva el id y gana por
  `updatedAt`; desmarcar un anuncio lo quita de `items`; fecha ocupada bloquea hasta elegir otra; imagen con el
  mismo hash se reutiliza; archivo inválido o de otra versión → error sin cambios; todo lo importado queda en
  `outbox`.
- Configuración: cada control guarda en `settings` y entra en `outbox`; texto vacío vuelve al valor por defecto;
  `/equipo` redirige; sin nube no aparece Equipo; almacenamiento muestra el uso y "Proteger los datos".
- Interfaz: la revisión (copia por defecto, cambiar a sobrescribir, desmarcar, fecha ocupada, confirmar).
