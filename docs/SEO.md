# CamioNex — SEO

> Estado al 21/09/2026. Qué se hizo en el código, qué falta hacer **fuera** del
> código y qué queda pendiente por decisión.

Este documento existe porque buena parte del posicionamiento no se resuelve
programando: el dominio, las redirecciones, el alta en Search Console y los
enlaces entrantes son trabajo de infraestructura y de marketing, y sin ellos los
cambios de código no se traducen en posiciones.

---

## 1. El problema que se corrigió

El sitio corría con `ssr: false`. Pre-renderizar una SPA produce el **esqueleto**
de la aplicación, no la página: el HTML que llegaba a los buscadores era este.

```html
<!DOCTYPE html><html lang="es"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="...">
  <!-- ni <title>, ni canonical, ni datos estructurados -->
</head><body><div id="__nuxt"></div></body></html>
```

Sin `<title>` —la etiqueta que más pesa en el `<head>`— y con el `<body>` vacío.
La causa del título faltante era `titleTemplate: "FleetLog"` declarado como
cadena literal: al no haber un `title`, la plantilla no producía nada.

Googlebot ejecuta JavaScript, pero lo hace en una segunda pasada, con retraso y
sin garantías. Bing y DuckDuckGo son bastante peores. Y WhatsApp y LinkedIn no
ejecutan JavaScript en absoluto: las previsualizaciones al compartir el enlace
salían vacías, agravado por un `og:image` con ruta relativa, que esas plataformas
descartan.

**Después de los cambios**, la portada llega así:

| | Antes | Ahora |
|---|---|---|
| `<title>` | *no existía* | `Software de gestión de flotas de camiones \| CamioNex` |
| Palabras indexables | 0 | 1.227 |
| Canonical | no | `https://www.camionex.com.ar/` |
| Datos estructurados | no | `Organization`, `WebSite`, `SoftwareApplication` (con planes y precios), `FAQPage` |
| `og:image` | `/og-camionex.png` (relativa, se descartaba) | absoluta, con dimensiones y `alt` |
| Peso del HTML | 6 kB de esqueleto | 121 kB con la página entera |

---

## 2. Qué se cambió en el código

### Renderizado — `nuxt.config.ts`

- `ssr: true` con **renderizado híbrido**: las páginas públicas se
  pre-renderizan a HTML estático en el build; todo el sistema de gestión sigue
  siendo SPA vía `routeRules`, para no romper la sesión en
  localStorage/Preferences ni el empaquetado con Capacitor.
- Las rutas privadas se sirven con `X-Robots-Tag: noindex, nofollow`. Es más
  fuerte que `robots.txt`, que sólo pide no rastrear y no impide indexar una URL
  que el buscador encontró enlazada desde otro lado.
- `features.inlineStyles: false`. Al activar SSR, Nuxt embebe el CSS de los
  componentes en cada documento: con Vuetify completo eran **860 kB de `<style>`
  por página**, sin caché entre navegaciones. El HTML pasó de 945 kB a 121 kB.

### Cabeceras y metadatos

- `title` propio por página + `titleTemplate` que agrega la marca al final.
- `lang="es-AR"` en vez de `es`: define el mercado al que apunta la página.
- `robots: index, follow, max-image-preview:large, max-snippet:-1` — habilita la
  miniatura grande en Discover y el fragmento completo en resultados.
- `preconnect` a la API, que la landing consulta apenas monta.

### Piezas nuevas

- **`composables/useSeoSitio.ts`** — fuente única de la marca y el dominio, más
  `useCanonical()`, `useDatosEstructurados()`, `organizacionJsonLd()` y
  `migasJsonLd()`.
- **Datos estructurados** en la portada (`SoftwareApplication` con los planes,
  `FAQPage` con las seis preguntas) y migas de pan en las dos páginas legales.
  Los precios del JSON-LD salen de la **misma** variable que dibuja las
  tarjetas: si el marcado declarara un precio distinto al visible, Google lo
  descarta por inconsistente.
  *No se declara `aggregateRating`*: no hay reseñas publicadas, e inventarlas es
  motivo de penalización manual.
- **`error.vue`** — `noindex` (una 404 no debe entrar al índice) y enlaces de
  salida hacia el inicio.
- **`robots.txt` / `sitemap.xml`** — dominio nuevo, `lastmod`, y el manual
  declarado. No se bloquea `/_nuxt/`: Google necesita el CSS y el JS para
  renderizar, y bloquearlos es el error clásico que hunde la evaluación móvil.
- **El manual** (`/docs/manual/manual.html`) pasó a ser una página indexable con
  título, descripción y canónica propias, enlazada desde el pie. Es el texto más
  extenso del sitio y el que puede responder consultas de cola larga.

### Segunda tanda (07/09/2026): contenido y registro único

- **`seo/paginas.ts`** — el registro de páginas públicas. La misma lista estaba
  escrita a mano en cuatro lugares que no se hablaban (`routeRules`,
  `nitro.prerender.routes`, `sitemap.xml` y el pie), y agregar una página exigía
  acordarse de los cuatro. Ahora sale de acá. Es un módulo plano, sin imports,
  porque `nuxt.config.ts` se evalúa antes de que existan los alias de Nuxt.
- **`server/routes/sitemap.xml.ts`** — el sitemap se genera desde ese registro y
  se pre-renderiza en el build, así que en producción se sirve estático igual
  que antes. `public/sitemap.xml` se eliminó: un sitemap incompleto no da error,
  simplemente deja páginas sin descubrir, y esa es la falla que se venía.
- **Tres páginas temáticas**, con `PaginaTema.vue` como molde (encabezado con
  migas visibles, índice con anclas y cierre con llamada a la acción):

  | Ruta | Consulta que ataca | Palabras |
  |---|---|---|
  | `/control-vencimientos-cnrt` | "control de vencimientos CNRT", "cuándo vence la LiNTI" | ~1.400 |
  | `/rendicion-de-viajes` | "rendición de gastos de viaje camión", "planilla de gastos del chofer" | ~1.500 |
  | `/costo-por-kilometro` | "cómo calcular el costo por kilómetro de un camión" | ~1.570 |

  Cada una con `title` y `description` propios, canónica, `BreadcrumbList` y
  `FAQPage`; `/costo-por-kilometro` suma `HowTo`, que es el tipo que describe
  una fórmula con pasos.
- **El ejemplo numérico del costo por kilómetro se calcula, no se escribe.** Los
  totales salen de `computed` sobre los renglones. Si fueran literales, tocar un
  renglón dejaría la tabla sin cerrar, y una página que enseña a hacer una
  cuenta y se equivoca en la suya pierde lo único que vino a construir.
- **Enlaces internos.** Las páginas nuevas se enlazan desde la sección "Guías
  del oficio" de la portada, desde el cuerpo de las secciones que les
  corresponden y desde la columna "Recursos" del pie —que se dibuja sola desde
  el registro—, con texto de ancla que dice de qué trata la página. Y las tres
  se enlazan entre sí. Una página que está en el sitemap pero a la que no apunta
  ningún enlace interno se rastrea tarde y se posiciona peor.
- **`og:image:width` / `height`** declaraban 1200×630 y el archivo mide
  1730×909. Las plataformas usan esos valores para reservar el espacio antes de
  descargar la imagen: si no coinciden, la vista previa salta o recorta.

#### Lo que se decidió NO hacer

La versión anterior de este documento proponía una página
`/software-gestion-flotas` para la consulta de cabeza. **No se creó, a
propósito**: la portada ya se titula "Software de gestión de flotas de
camiones" y apunta exactamente a esa consulta. Dos páginas del mismo sitio
compitiendo por el mismo término se reparten las señales y las dos bajan.
La consulta de cabeza la defiende `/`; las páginas temáticas atacan lo que la
portada no puede decir sin desenfocarse.

### Correcciones de fondo que salieron al paso

- `composables/functions.ts` llamaba a `useRuntimeConfig()` **a nivel de módulo**,
  fuera de toda instancia de Nuxt. En el navegador pasaba desapercibido; al
  renderizar en servidor tiraba `[nuxt] instance unavailable` e impedía
  pre-renderizar la portada entera.
- `composables/usePersist.ts` ahora es no-op en el servidor. El middleware global
  corre también ahí y llamaba a `localStorage`, que no existe.
- `plugins/vuetify.ts` con `ssr: true`, para que `useDisplay()` no produzca
  marcado distinto en servidor y cliente.

### Tercera tanda (21/09/2026): el aviso "Excluida por una etiqueta noindex"

Search Console avisó que había páginas **excluidas por `noindex`**. Antes de
tocar nada, qué significa: las rutas privadas (`/admin`, `/auth/login`…) se
sirven con `X-Robots-Tag: noindex` **a propósito**, y Google las lista ahí
cada vez que sigue el botón "Ingresar" de la portada. Esas entradas son
correctas y van a seguir apareciendo: el informe es informativo, no un error.

Lo que sí estaba mal, y se corrigió:

- **Cualquier URL inexistente respondía `302 → /auth/login`.** El middleware
  global trataba "no hay página" como "ruta privada sin sesión". Así, cada
  enlace roto o URL vieja (`/login`, `/home`, `/docs/manual`) que Google
  encontraba terminaba en ese informe como "noindex" en vez de como un **404**,
  que es lo único que le dice al buscador que la olvide. Ahora
  `auth.global.ts` deja pasar las rutas sin página y Nuxt responde 404 con
  `error.vue` (que ya declaraba `noindex, follow`).
- **`https://camionex.com.ar/` (sin `www`) respondía 200** con el mismo
  contenido que la canónica, y lo mismo las variantes con barra final
  (`/rendicion-de-viajes/`). El `canonical` lo mitigaba, pero es una
  sugerencia. `server/plugins/url-canonica.ts` responde **301** a `www` y sin
  barra final, conservando la query. Es un plugin con el hook `request` y no un
  `server/middleware` porque las páginas públicas están pre-renderizadas y el
  handler estático de Nitro corre antes que cualquier middleware: con un
  middleware el 301 nunca se ejecutaba justo para las páginas que importan.
  Sigue siendo una red de seguridad: la redirección de host corresponde a
  nginx (§3.1).
- **El shell de las rutas privadas decía `<meta name="robots" content="index">`**
  mientras la cabecera decía `noindex`. Google se queda con la más restrictiva,
  pero son señales cruzadas. El `robots` global salió de `nuxt.config.ts` y
  ahora lo declara `useCanonical()`: tener canónica y ser indexable es la
  misma decisión.
- `/docs/manual` (sin `manual.html`) redirige **301** al manual en vez de caer
  en el login.

Cómo verificar desde afuera, sin backend (`curl -sI -A Googlebot`):
`/noexiste` → 404 · `/login` → 404 · `camionex.com.ar/` → 301 a `www` ·
`/rendicion-de-viajes/` → 301 sin barra · `/admin` → 200 + `X-Robots-Tag`.

---

## 3. Lo que hay que hacer fuera del código

Sin esto, nada de lo anterior posiciona. En orden de urgencia:

1. **Dominio y DNS.** Registrar `camionex.com.ar` y apuntarlo. Elegir **una**
   variante canónica —se dejó configurado `www`— y redirigir la otra con **301**.
   Servir todo por HTTPS y redirigir `http://` con 301.
   → Al 21/09/2026: `http://` ya redirige, pero **`https://camionex.com.ar/`
   sigue respondiendo 200** desde nginx. Nitro lo cubre con un 301 sólo si nginx
   le reenvía el `Host` original; lo correcto es resolverlo en nginx con un
   `server` propio para el host sin `www`:

   ```nginx
   server {
       listen 443 ssl http2;
       server_name camionex.com.ar;
       # mismos ssl_certificate / ssl_certificate_key que el server de www
       return 301 https://www.camionex.com.ar$request_uri;
   }
   ```

   Y en el `location /` que hace `proxy_pass` al 3006, asegurarse de que
   estén `proxy_set_header Host $host;` y
   `proxy_set_header X-Forwarded-Proto $scheme;`, que es lo que le permite a
   Nitro ver el host y el protocolo reales.
2. **Si `fleetlog.com.ar` llegó a estar publicado e indexado**, montar
   redirecciones **301 una a una** hacia la URL equivalente de `camionex.com.ar`.
   Un 302, o un 301 masivo a la home, tira a la basura la autoridad acumulada.
   Mantenerlas al menos un año.
3. ~~**Google Search Console** — verificar la propiedad, enviar
   `https://www.camionex.com.ar/sitemap.xml` y pedir la indexación de la portada.~~
   → hecho el 16/09/2026: propiedad **de dominio** `camionex.com.ar` (verificada
   con registro TXT en Route 53; no borrar ese registro, Google lo revalida),
   sitemap enviado e indexación de la portada solicitada. Se eligió propiedad de
   dominio y no prefijo de URL porque abarca `www`/sin `www` y `http`/`https`
   en un solo informe, igual que las demás propiedades de la cuenta.
   Si hubo cambio de dominio, usar además la **herramienta de cambio de
   dirección**.
4. **Bing Webmaster Tools** — misma operación. Alcanza con importar desde Search
   Console. Cubre también DuckDuckGo, que usa el índice de Bing.
5. **Google Business Profile** — con el teléfono de Chaco (+54 362) hay
   intención local que hoy se está perdiendo entera.
6. **Rehacer las piezas gráficas**, que siguen con la marca vieja:
   - ~~`public/og-camionex.png`~~ → **hecho**: reemplazada por
     `public/og-camionex.jpg`, con la marca CamioNex, en 1200×630 y ~70 kB (la
     anterior decía FleetLog y pesaba 1,2 MB, así que WhatsApp no la mostraba).
     Si se vuelve a cambiar: mantenerla bajo **300 kB**, actualizar
     `og:image:width` / `height` en `nuxt.config.ts` y, mejor, cambiarle el
     nombre al archivo para que WhatsApp no siga usando la versión que tiene
     guardada.
   - `public/images/logos/logo*.png` e `icon.png` — los cinco archivos.
   - Los favicons y los íconos de `android-chrome-*`.

---

## 4. Lo que queda pendiente y por qué

### ~~Peso de la página~~ → resuelto el 17/11/2026

En producción la portada descargaba **5,2 MB sin comprimir**: 4,4 MB de JS y
835 kB de CSS, porque ni nginx ni Nitro comprimían. Tres causas, tres arreglos:

| Causa | Arreglo |
|---|---|
| Vuetify registrado entero (`import * as components`) | `vite-plugin-vuetify` con `autoImport` (hook en `modules` de `nuxt.config.ts`) |
| `app.use(VueTablerIcons)`: los ~4.000 íconos en todas las páginas | Se quitó: cada pantalla ya importaba por nombre los que usa |
| Sin compresión | `nitro.compressPublicAssets` genera `.br` y `.gz` en el build |

Resultado en el JS principal: **4.382 kB → 534 kB, y 158 kB transferidos con
brotli** (~28 veces menos). El HTML de la portada viaja en 13 kB.

Verificación hecha: las 66 etiquetas `v-*` del proyecto se resuelven contra
el `importMap` de Vuetify; no hay directivas `v-tooltip`/`v-ripple`… usadas
como directiva ni componentes por nombre en `:is`. La portada y el login se
revisaron en el navegador sin errores de consola. **Las pantallas con sesión no
se recorrieron una por una**: si alguna muestra un componente de Vuetify sin
estilo o vacío, la causa es esta y el arreglo es importarlo en esa pantalla.

Además, la tipografía (Plus Jakarta Sans) pasó de un `@import` en
`scss/style.scss` a un `<link>` con `preconnect` en el `<head>`.

Lo que sigue pesando es `entry.css` (658 kB, 67 kB con brotli), en buena parte
la fuente de íconos `@mdi/font` completa. Pasar a SVG por ícono es el siguiente
paso si hiciera falta, pero ya no es un freno.

### Más contenido — el trabajo que sigue

Las tres páginas temáticas están (§2). Lo que sigue es cola larga, y ya no es
trabajo de arquitectura sino de escribir:

Hechas el 17/11/2026: `/app-para-choferes` ("app para choferes de camión",
"checklist pre-viaje digital") y `/mantenimiento-preventivo-camiones` ("plan de
mantenimiento preventivo de camiones"), enlazadas desde "Guías del oficio" y
el pie. Todo lo que afirman del producto sale del manual y del backend.

| Página sugerida | Consulta que ataca |
|---|---|
| `/planilla-oea-arca` | "planilla OEA 7 puntos", "OEA ARCA transporte" |
| `/control-combustible-flota` | "control de combustible de camiones", "rendimiento km/l" |
| `/blog/...` | normativa, costos, gestión de choferes |

**Para agregar una página nueva**: crearla usando `LandingPaginaTema`, sumarla a
`PAGINAS_PUBLICAS` en `seo/paginas.ts` —eso ya la pre-renderiza, la publica en
el sitemap y la enlaza en el pie— y agregar su prefijo a
`RUTAS_PUBLICAS_POR_PREFIJO` en `composables/useRutasPublicas.ts`, o el
middleware global manda a login justo al visitante que llegó desde una búsqueda.
Esos dos lugares siguen separados a propósito: el segundo es la pieza donde un
error no rompe una pantalla sino que deja el sistema abierto, y se testea aparte.

### Enlaces entrantes

Es el factor que más pesa y el único que no se resuelve desde el repositorio.
Cámaras del sector (FADEEAC y las federaciones provinciales), directorios de
software de gestión en Argentina, y notas técnicas sobre normativa CNRT firmadas
por la empresa.

---

## 5. Al cambiar el dominio, tocar estos cuatro lugares

No hay una sola fuente de verdad porque los tres primeros se evalúan en
contextos distintos —el build, la aplicación y Nitro— y ninguno puede importar
el composable de los otros:

- `nuxt.config.ts` → `ORIGEN`
- `composables/useSeoSitio.ts` → `SITIO.origen`
- `server/routes/sitemap.xml.ts` → `ORIGEN`
- `public/robots.txt` → la línea `Sitemap:`

Y en `docs/manual-usuario/manual.html`, la etiqueta `<link rel="canonical">`.

(Los `<loc>` del sitemap ya no están en la lista: se arman con ese `ORIGEN` y
las rutas de `seo/paginas.ts`.)
