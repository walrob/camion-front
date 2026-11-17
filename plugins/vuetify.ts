import { createVuetify } from "vuetify";
import { es } from "vuetify/locale";
import "@mdi/font/css/materialdesignicons.css";
import PerfectScrollbar from "vue3-perfect-scrollbar";
import "@/scss/style.scss";
import { FleetLight } from "@/theme/LightTheme";
import { FleetDark } from "@/theme/DarkTheme";
import { VFileUpload } from "vuetify/labs/VFileUpload";
import { VColorInput } from "vuetify/labs/VColorInput";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    // Necesario desde que las páginas públicas se renderizan en el servidor.
    // Sin esto, `useDisplay()` resuelve el ancho de pantalla en el servidor
    // (donde no hay ninguno) y el marcado que llega no coincide con el que
    // arma el navegador: la hidratación falla y Vue vuelve a dibujar la página.
    ssr: true,
    // Los componentes y directivas de Vuetify los resuelve `vite-plugin-vuetify`
    // en el build (ver `nuxt.config.ts`): cada pantalla se lleva sólo lo que
    // usa. Antes se registraba la biblioteca entera (`import * as components`)
    // y la portada bajaba 4,4 MB de JS para mostrar precios. Los de `labs` se
    // siguen registrando a mano porque el plugin no los detecta.
    components: {
      VFileUpload,
      VColorInput,
    },
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
  // Los íconos de Tabler NO se registran globales: `app.use(VueTablerIcons)`
  // metía los ~4.000 íconos en el bundle de todas las páginas, y cada pantalla
  // ya importa por nombre los pocos que usa.
  // ApexCharts NO se registra global: se importa localmente solo en las páginas
  // que lo usan (dashboard, indicadores) para no cargar la librería en todo el bundle.
});
