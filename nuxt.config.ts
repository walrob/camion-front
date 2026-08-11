// https://nuxt.com/docs/api/configuration/nuxt-config
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Detectar archivo .env según NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
loadEnv({ path: resolve(process.cwd(), envFile) });

export default defineNuxtConfig({
  ssr: false,

  typescript: {
    shim: false,
  },

  app: {
    head: {
      htmlAttrs: { lang: "es" },
      charset: "utf-8",
      // interactive-widget=resizes-content: al abrir el teclado en mobile el
      // viewport (y las unidades dvh) se achica, así los inputs fijos/al fondo
      // suben por encima del teclado en vez de quedar tapados.
      viewport:
        "width=device-width, initial-scale=1, interactive-widget=resizes-content",
      titleTemplate: "FleetLog",
      // titleTemplate: "%s | FleetLog",
      meta: [
        {
          name: "description",
          content:
            "FleetLog reemplaza el cuaderno del chofer, el Excel y los grupos " +
            "de WhatsApp: rendiciones automáticas, control de vencimientos y " +
            "costo por kilómetro. Probalo gratis 21 días.",
        },
        { name: "author", content: "NorthAr Consulting" },
        // Debe seguir a `primary` de FleetLight (theme/LightTheme.ts).
        { name: "theme-color", content: "#2563EB" },

        // ── Previsualización al compartir ──────────────────────────────────
        // Van acá, en la configuración global, y no sólo en la landing: con
        // `ssr: false` el pre-renderizado produce el shell de la SPA, sin
        // ejecutar el `<script setup>` de la página, así que un `useSeoMeta` en
        // el componente NO llega al HTML. WhatsApp y LinkedIn no ejecutan JS,
        // de modo que lo único que ven es esto.
        //
        // La contra es que todas las rutas comparten la misma tarjeta. Es
        // aceptable: nadie comparte `/admin/viajes`, y si lo hiciera vería la
        // tarjeta de FleetLog, que no molesta. Tener tarjetas por página exige
        // renderizado híbrido (ver el comentario de `nitro.prerender`).
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "FleetLog" },
        {
          property: "og:title",
          content: "FleetLog — Gestión de flotas para transporte de carga",
        },
        {
          property: "og:description",
          content:
            "Rendiciones que se arman solas, vencimientos bajo control y el " +
            "costo por kilómetro de tu flota. Probalo gratis 21 días, sin tarjeta.",
        },
        { property: "og:image", content: "/og-fleetlog.png" },
        { property: "og:locale", content: "es_AR" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "FleetLog — Gestión de flotas para transporte de carga",
        },
        {
          name: "twitter:description",
          content:
            "Rendiciones automáticas, vencimientos bajo control y costo por " +
            "kilómetro. Probalo gratis 21 días.",
        },
        { name: "twitter:image", content: "/og-fleetlog.png" },
      ],
      link: [{ rel: "manifest", href: "/site.webmanifest" }],
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
     * Con `ssr: false` no hay HTML pre-renderizado. Los crawlers modernos
     * ejecutan JS, pero WhatsApp y LinkedIn NO: las previsualizaciones al
     * compartir el link salen vacías. Es inaceptable para algo que se comparte
     * por WhatsApp, que es como se mueve la venta en este rubro.
     *
     * Se pre-renderizan sólo las páginas públicas; el resto sigue siendo SPA,
     * para no romper la autenticación en localStorage/Preferences ni Capacitor.
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
