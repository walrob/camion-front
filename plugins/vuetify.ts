import { createVuetify } from "vuetify";
import { es } from "vuetify/locale";
import "@mdi/font/css/materialdesignicons.css";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import PerfectScrollbar from "vue3-perfect-scrollbar";
import VueTablerIcons from "vue-tabler-icons";
import "@/scss/style.scss";
import { FleetLight } from "@/theme/LightTheme";
import { FleetDark } from "@/theme/DarkTheme";
import { VFileUpload } from "vuetify/labs/VFileUpload";
import { VColorInput } from "vuetify/labs/VColorInput";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components: {
      ...components,
      VFileUpload,
      VColorInput,
    },
    directives,
    locale: {
      locale: "es",
      fallback: "en",
      messages: { es },
    },
    theme: {
      defaultTheme: "FleetLight",
      themes: {
        FleetLight,
        FleetDark,
      },
    },
    // Defaults globales: consistencia visual en toda la app sin repetir props.
    // Cualquier prop explícita en un componente sobreescribe estos valores.
    defaults: {
      VBtn: { rounded: "lg" },
      VCard: { rounded: "lg" },
      VTextField: {
        variant: "outlined",
        density: "compact",
        color: "primary",
        hideDetails: "auto",
      },
      VTextarea: {
        variant: "outlined",
        density: "compact",
        color: "primary",
        hideDetails: "auto",
      },
      VSelect: {
        variant: "outlined",
        density: "compact",
        color: "primary",
        hideDetails: "auto",
      },
      VAutocomplete: {
        variant: "outlined",
        density: "compact",
        color: "primary",
        hideDetails: "auto",
      },
      VCombobox: {
        variant: "outlined",
        density: "compact",
        color: "primary",
        hideDetails: "auto",
      },
      VChip: { rounded: "md" },
      VDataTable: { density: "comfortable" },
    },
  });
  nuxtApp.vueApp.use(vuetify);
  nuxtApp.vueApp.use(PerfectScrollbar);
  nuxtApp.vueApp.use(VueTablerIcons);
  // ApexCharts NO se registra global: se importa localmente solo en las páginas
  // que lo usan (dashboard, indicadores) para no cargar la librería en todo el bundle.
});
