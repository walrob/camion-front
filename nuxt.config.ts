// https://nuxt.com/docs/api/configuration/nuxt-config
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Detectar archivo .env según NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
loadEnv({ path: resolve(process.cwd(), envFile) });

/**
 * Origen canónico del sitio.
 *
 * Duplica `SITIO.origen` de `composables/useSeoSitio.ts` porque este archivo se
 * evalúa antes de que existan los auto-imports de Nuxt. Si cambia acá, cambia
 * allá — y también en `public/robots.txt` y `public/sitemap.xml`.
 */
const ORIGEN = "https://www.camionex.com.ar";

/** Prefijos del sistema de gestión: privados, se sirven como SPA y sin indexar. */
const RUTAS_PRIVADAS = [
  "/admin",
  "/chofer",
  "/superadmin",
  "/auth",
  "/invite",
  "/initial",
  "/estado-plan",
  "/upgrade",
  "/configuracion",
  "/manual-usuario",
];

export default defineNuxtConfig({
  /**
   * Renderizado híbrido.
   *
   * Antes era `ssr: false` para todo el proyecto. El costo era invisible pero
   * total: el HTML de la landing llegaba a los buscadores **sin `<title>` y con
   * el `<body>` vacío**, porque pre-renderizar una SPA produce el shell, no la
   * página. No había nada que indexar.
   *
   * Ahora el servidor renderiza de verdad y el sistema de gestión se sigue
   * sirviendo como SPA vía `routeRules`, que es lo que necesita para no romper
   * la sesión en localStorage/Preferences ni el empaquetado con Capacitor.
   */
  ssr: true,

  typescript: {
    shim: false,
  },

  /**
   * Qué se renderiza y cómo.
   *
   * - Las páginas públicas se **pre-renderizan**: quedan como HTML estático en
   *   el build, sin costo de servidor y sin depender de que la API responda.
   * - Todo lo privado queda `ssr: false` (SPA) y con `noindex` por cabecera:
   *   son pantallas detrás de login, sin valor de búsqueda, y aparecer en
   *   Google sólo genera intentos de acceso. `X-Robots-Tag` es más fuerte que
   *   `robots.txt`, que sólo pide no rastrear y no impide indexar una URL que
   *   el buscador encontró enlazada desde otro lado.
   */
  routeRules: {
    "/": { prerender: true },
    "/politica-de-privacidad": { prerender: true },
    "/terminos-y-condiciones": { prerender: true },

    ...Object.fromEntries(
      RUTAS_PRIVADAS.flatMap((r) => {
        const regla = {
          ssr: false,
          headers: { "X-Robots-Tag": "noindex, nofollow" },
        };
        // Se declaran la raíz del prefijo y sus subrutas: `/admin/**` no
        // matchea `/admin` a secas.
        return [
          [r, regla],
          [`${r}/**`, regla],
        ];
      }),
    ),
  },

  app: {
    head: {
      // `es-AR` y no `es`: el producto, los precios y el vocabulario ("chofer",
      // "rendición", "patente") son argentinos. Le dice al buscador a qué
      // mercado pertenece la página.
      htmlAttrs: { lang: "es-AR" },
      charset: "utf-8",
      // interactive-widget=resizes-content: al abrir el teclado en mobile el
      // viewport (y las unidades dvh) se achica, así los inputs fijos/al fondo
      // suben por encima del teclado en vez de quedar tapados.
      viewport:
        "width=device-width, initial-scale=1, interactive-widget=resizes-content",

      /**
       * El título se compone: cada página aporta el suyo y la marca se agrega
       * al final.
       *
       * Antes esto era la cadena literal `"CamioNex"`, y eso hacía dos daños a
       * la vez: pisaba el título propio de cada página y, cuando la página no
       * declaraba ninguno, el HTML salía **sin `<title>`**. El título es la
       * señal más fuerte del `<head>` y lo que se lee en el resultado de
       * búsqueda.
       *
       * `title` es el que se usa cuando la página no declara ninguno, y va
       * **sin** la marca porque la agrega `titleTemplate`: con la marca acá,
       * esas páginas salían como "CamioNex — … | CamioNex".
       *
       * El template va como cadena con `%s` y no como función: `app.head` se
       * serializa al build, así que no admite funciones —TypeScript lo marca— y
       * una función acá se pierde en el HTML que ve el buscador.
       */
      title: "Software de gestión de flotas de camiones",
      titleTemplate: "%s | CamioNex",

      meta: [
        {
          name: "description",
          content:
            "CamioNex es el software de gestión de flotas para empresas de " +
            "transporte de carga en Argentina: rendiciones de viaje automáticas, " +
            "control de vencimientos y costo por kilómetro. Probalo gratis 30 días.",
        },
        { name: "author", content: "NorthAr Consulting" },
        // Debe seguir a `primary` de FleetLight (theme/LightTheme.ts).
        { name: "theme-color", content: "#2563EB" },

        /**
         * Permiso explícito para las vistas previas enriquecidas. Sin
         * `max-image-preview:large` Google recorta la miniatura a un ícono en
         * Discover y en resultados de imágenes; `max-snippet:-1` lo deja usar
         * el fragmento completo en vez de cortarlo.
         */
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },

        // ── Previsualización al compartir ──────────────────────────────────
        // Globales, para que cualquier ruta compartida por WhatsApp muestre una
        // tarjeta válida. Las páginas públicas las pisan con su propio texto.
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "CamioNex" },
        {
          property: "og:title",
          content: "CamioNex — Software de gestión de flotas de camiones",
        },
        {
          property: "og:description",
          content:
            "Rendiciones que se arman solas, vencimientos bajo control y el " +
            "costo por kilómetro de tu flota. Probalo gratis 30 días, sin tarjeta.",
        },
        // Absoluta, no `/og-camionex.png`: WhatsApp, LinkedIn y Facebook
        // descartan las rutas relativas y la tarjeta sale sin imagen. Este era
        // el motivo real de que las previsualizaciones salieran en blanco.
        { property: "og:image", content: `${ORIGEN}/og-camionex.png` },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content:
            "Tablero de CamioNex con el estado de la flota, los vencimientos y el costo por kilómetro",
        },
        { property: "og:locale", content: "es_AR" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "CamioNex — Software de gestión de flotas de camiones",
        },
        {
          name: "twitter:description",
          content:
            "Rendiciones automáticas, vencimientos bajo control y costo por " +
            "kilómetro. Probalo gratis 30 días.",
        },
        { name: "twitter:image", content: `${ORIGEN}/og-camionex.png` },
      ],

      link: [
        { rel: "manifest", href: "/site.webmanifest" },
        // Canonical por defecto: cubre las rutas que no declaran el suyo. Cada
        // página pública lo pisa con `useCanonical()`.
        { rel: "canonical", href: ORIGEN },
        // La landing pide los precios a la API apenas monta. Abrir la conexión
        // (DNS + TLS) en paralelo con el HTML adelanta ese primer dato.
        {
          rel: "preconnect",
          href: "https://www.camionex.com.ar",
          crossorigin: "anonymous",
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_BASE_URL,
      apiFilesUrl: process.env.NUXT_BASE_URL_FILES,
      gaMeasurementId: process.env.GA_MEASUREMENT_ID,
      gaEnabled: process.env.GA_ENABLED === "true",
    },
  },

  /**
   * Estilos en hoja aparte, no embebidos en el HTML.
   *
   * Al activar el renderizado en servidor, Nuxt embebe por defecto el CSS de
   * los componentes dentro de cada documento. Con Vuetify registrado completo
   * eso son ~860 kB de `<style>` en **cada** página: un HTML de casi un mega,
   * que no se cachea entre navegaciones y que el navegador tiene que parsear
   * entero antes de pintar. Es exactamente lo que castiga el LCP, y el LCP es
   * factor de posicionamiento.
   *
   * Con la hoja externa el CSS se descarga una vez, queda en caché para el
   * resto de las páginas y el HTML vuelve a pesar decenas de kB.
   */
  features: {
    inlineStyles: false,
  },

  build: {
    transpile: ["vuetify"],
  },

  vite: {
    define: {
      "process.env.DEBUG": false,
    },
  },

  nitro: {
    serveStatic: true,

    /**
     * El manual de usuario se sirve tal cual desde `docs/manual-usuario`, que
     * sigue siendo su única fuente: se edita ahí y se publica con el deploy.
     */
    publicAssets: [
      {
        dir: resolve(process.cwd(), "docs/manual-usuario"),
        // Bajo /docs/manual y no /manual: Nitro matchea los publicAssets por
        // prefijo, y "/manual" se comería también la ruta /manual-usuario.
        baseURL: "/docs/manual",
        maxAge: 60 * 60, // 1 h: se actualiza con cada release
      },
    ],

    /**
     * Las páginas públicas se congelan en HTML durante el build. Con `ssr: true`
     * esto ya no produce el shell vacío de antes: sale el texto completo, que es
     * lo que indexa el buscador y lo que leen WhatsApp y LinkedIn, que no
     * ejecutan JavaScript.
     */
    prerender: {
      crawlLinks: false,
      routes: ["/", "/politica-de-privacidad", "/terminos-y-condiciones"],
      // La landing consulta `/plans/public` desde el cliente; si la API no está
      // disponible durante el build, eso no debe frenar el despliegue (R7.3).
      failOnError: false,
    },
  },

  compatibilityDate: "2025-04-15",

  modules: ["@nuxt/eslint", "@pinia/nuxt"],
});
