import type { ThemeTypes } from "@/types/themeTypes/ThemeType";

// Tema claro corporativo de FleetLog.
// Azul profundo (confianza/logística) + teal de apoyo + semánticos accesibles (AA).
// Se conservan TODAS las claves que consumen scss y componentes.
const FleetLight: ThemeTypes = {
  name: "FleetLight",
  dark: false,
  variables: {
    "hover-table": "#f8fafc",
    "border-color": "#e2e8f0",
    "carousel-control-size": 10,
    // Sombras propias: difusas y de baja opacidad (nunca el negro duro de MD).
    "shadow-key-umbra-opacity": 0.04,
    "shadow-key-penumbra-opacity": 0.03,
    "shadow-key-ambient-opacity": 0.02,
  },
  colors: {
    primary: "#2563EB",
    secondary: "#0E9F9A",
    info: "#0EA5E9",
    success: "#16A34A",
    accent: "#6366F1",
    warning: "#F59E0B",
    error: "#DC2626",
    muted: "#64748B",
    lightprimary: "#E8EEFD",
    lightsecondary: "#E4F5F4",
    lightsuccess: "#E8F6EE",
    lighterror: "#FBEAEA",
    lightwarning: "#FEF3E2",
    lightinfo: "#E6F4FD",
    textPrimary: "#1E293B",
    textSecondary: "#64748B",
    borderColor: "#E2E8F0",
    inputBorder: "#CBD5E1",
    containerBg: "#ffffff",
    hoverColor: "#F1F5F9",
    surface: "#ffffff",
    // Lienzo gris azulado: separa la página de las cards blancas y le da
    // profundidad al layout sin recurrir a sombras fuertes.
    background: "#F4F6FB",
    "on-surface-variant": "#ffffff",
    grey100: "#F8FAFC",
    grey200: "#F1F5F9",
    // Paleta de gráficos: tintes suaves y armónicos (no la saturación de la UI).
    chartPrimary: "#5B8DEF",
    chartSecondary: "#3FBFB5",
    chartInfo: "#56C4E0",
    chartSuccess: "#6FC79A",
    chartWarning: "#ED9F52",
    chartError: "#E87C7C",
    chartAccent: "#9B8CEC",
    chartAmber: "#F1C85A",
    chartGrey: "#AEB8C4",
  },
};
export { FleetLight };
