# CamioNex — SEO

> Estado al 02/09/2026. Qué se hizo en el código, qué falta hacer **fuera** del
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

### Correcciones de fondo que salieron al paso

- `composables/functions.ts` llamaba a `useRuntimeConfig()` **a nivel de módulo**,
  fuera de toda instancia de Nuxt. En el navegador pasaba desapercibido; al
  renderizar en servidor tiraba `[nuxt] instance unavailable` e impedía
  pre-renderizar la portada entera.
- `composables/usePersist.ts` ahora es no-op en el servidor. El middleware global
  corre también ahí y llamaba a `localStorage`, que no existe.
- `plugins/vuetify.ts` con `ssr: true`, para que `useDisplay()` no produzca
  marcado distinto en servidor y cliente.

---

## 3. Lo que hay que hacer fuera del código

Sin esto, nada de lo anterior posiciona. En orden de urgencia:

1. **Dominio y DNS.** Registrar `camionex.com.ar` y apuntarlo. Elegir **una**
   variante canónica —se dejó configurado `www`— y redirigir la otra con **301**.
   Servir todo por HTTPS y redirigir `http://` con 301.
2. **Si `fleetlog.com.ar` llegó a estar publicado e indexado**, montar
   redirecciones **301 una a una** hacia la URL equivalente de `camionex.com.ar`.
   Un 302, o un 301 masivo a la home, tira a la basura la autoridad acumulada.
   Mantenerlas al menos un año.
3. **Google Search Console** — verificar la propiedad, enviar
   `https://www.camionex.com.ar/sitemap.xml` y pedir la indexación de la portada.
   Si hubo cambio de dominio, usar además la **herramienta de cambio de
   dirección**.
4. **Bing Webmaster Tools** — misma operación. Alcanza con importar desde Search
   Console. Cubre también DuckDuckGo, que usa el índice de Bing.
5. **Google Business Profile** — con el teléfono de Chaco (+54 362) hay
   intención local que hoy se está perdiendo entera.
6. **Rehacer las piezas gráficas**, que siguen con la marca vieja:
   - `public/og-camionex.png` — el archivo se renombró, **la imagen sigue
     diciendo FleetLog**. Es lo que se ve al compartir por WhatsApp. 1200×630.
   - `public/images/logos/FletLog*.png` — los cinco archivos.
   - Los favicons y los íconos de `android-chrome-*`.

---

## 4. Lo que queda pendiente y por qué

### Peso de la página — el freno más grande que queda

Medido sobre el build actual, la portada descarga:

```
JS   /_nuxt/CRovjvHX.js     4.276 kB
CSS  /_nuxt/entry.css         814 kB
                            ─────────
                            ~5.100 kB sin comprimir
```

La causa es `plugins/vuetify.ts`, que registra **todos** los componentes de
Vuetify de forma global (`components: { ...components }`). Un visitante que entra
a leer los precios se baja la biblioteca entera. En una PyME de transporte, que
va a abrir esto desde un celular y con datos móviles, eso es abandono antes de
ver el primer precio — y LCP e INP son factores de posicionamiento declarados.

**La solución** es `vite-plugin-vuetify` con `autoImport: true`, que resuelve los
componentes en tiempo de compilación y deja fuera lo que no se usa. Suele
recortar el bundle a una fracción.

**No se aplicó** porque no está instalado y porque cambia cómo se resuelve cada
componente de Vuetify en las ~50 pantallas de la aplicación: exige QA visual
completo, no una verificación de build. Es la decisión de mayor impacto que queda
pendiente y conviene tomarla aparte, con tiempo de prueba.

### Una sola página no alcanza para competir

Hoy hay tres URL públicas. Una página sola no puede rankear para todo el abanico
de consultas del rubro, porque cada consulta quiere una página que la responda
específicamente. Las que faltan, en orden de valor:

| Página sugerida | Consulta que ataca |
|---|---|
| `/software-gestion-flotas` | "software de gestión de flotas" (cabeza) |
| `/control-vencimientos-cnrt` | "control de vencimientos CNRT / LiNTI" |
| `/rendicion-de-viajes` | "rendición de gastos de viaje camión" |
| `/costo-por-kilometro` | "cómo calcular el costo por kilómetro de un camión" |
| `/blog/...` | cola larga: normativa, costos, gestión de choferes |

`useCanonical()`, `organizacionJsonLd()` y `migasJsonLd()` ya están listos para
que cada una las use. Al agregarlas hay que sumarlas a `nitro.prerender.routes`,
a `sitemap.xml` y a `RUTAS_PUBLICAS_POR_PREFIJO`.

### Enlaces entrantes

Es el factor que más pesa y el único que no se resuelve desde el repositorio.
Cámaras del sector (FADEEAC y las federaciones provinciales), directorios de
software de gestión en Argentina, y notas técnicas sobre normativa CNRT firmadas
por la empresa.

---

## 5. Al cambiar el dominio, tocar estos cuatro lugares

No hay una sola fuente de verdad porque dos de los archivos son estáticos:

- `nuxt.config.ts` → `ORIGEN`
- `composables/useSeoSitio.ts` → `SITIO.origen`
- `public/robots.txt` → la línea `Sitemap:`
- `public/sitemap.xml` → los `<loc>`

Y en `docs/manual-usuario/manual.html`, la etiqueta `<link rel="canonical">`.
