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
          content: "Sistema de gestión de flota de camiones",
        },
        { name: "author", content: "NorthAr Consulting" },
        { name: "theme-color", content: "#5D87FF" },
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
  },

  compatibilityDate: "2025-04-15",

  modules: ["@nuxt/eslint", "@pinia/nuxt"],
});
