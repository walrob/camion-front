import { createVuetify } from "vuetify";
import { es } from "vuetify/locale";
import "@mdi/font/css/materialdesignicons.css";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import PerfectScrollbar from "vue3-perfect-scrollbar";
import VueTablerIcons from "vue-tabler-icons";
import VueApexCharts from "vue3-apexcharts";
import "@/scss/style.scss";
import { PurpleTheme } from "@/theme/LightTheme";
import { DarkTheme } from "@/theme/DarkTheme";
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
      defaultTheme: "PurpleTheme",
      themes: {
        PurpleTheme,
        DarkTheme,
      },
    },
  });
  nuxtApp.vueApp.use(vuetify);
  nuxtApp.vueApp.use(PerfectScrollbar);
  nuxtApp.vueApp.use(VueTablerIcons);
  nuxtApp.vueApp.use(VueApexCharts);
});
