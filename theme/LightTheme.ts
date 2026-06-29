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
    "on-surface-variant": "#ffffff",
    grey100: "#F8FAFC",
    grey200: "#F1F5F9",
  },
};
export { FleetLight };
