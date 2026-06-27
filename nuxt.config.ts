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
      viewport: "width=device-width, initial-scale=1",
      titleTemplate: "%s | ERP Textil",
      meta: [
        { name: "description", content: "ERP para empresa textil" },
        { name: "author", content: "ERP Textil" },
        { name: "theme-color", content: "#5D87FF" },
      ],
      link: [
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_BASE_URL,
      apiFilesUrl: process.env.NUXT_BASE_URL_FILES,
      gaMeasurementId: process.env.GA_MEASUREMENT_ID,
      gaEnabled: process.env.GA_ENABLED === "true",
      bankInfoCbu: process.env.BANK_INFO_CBU,
      bankInfoAlias: process.env.BANK_INFO_ALIAS,
      bankInfoCuil: process.env.BANK_INFO_CUIL,
      bankInfoTitular: process.env.BANK_INFO_TITULAR,
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

  devServerHandlers: [],

  hooks: {},

  compatibilityDate: "2025-04-15",

  modules: ["@nuxt/eslint", "@pinia/nuxt"],
});
