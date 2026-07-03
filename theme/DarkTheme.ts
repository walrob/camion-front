import type { ThemeTypes } from "@/types/themeTypes/ThemeType";

// Tema oscuro corporativo de FleetLog (mismos acentos de marca sobre fondos slate).
const FleetDark: ThemeTypes = {
  name: "FleetDark",
  dark: true,
  variables: {
    "hover-table": "#1e293b",
    "border-color": "#334155",
    "carousel-control-size": 10,
  },
  colors: {
    primary: "#5B8DEF",
    secondary: "#2DD4BF",
    info: "#38BDF8",
    success: "#4ADE80",
    accent: "#818CF8",
    warning: "#FBBF24",
    error: "#F87171",
    muted: "#94A3B8",
    lightprimary: "#1E293B",
    lightsecondary: "#15302E",
    lightsuccess: "#16301F",
    lighterror: "#341C1C",
    lightwarning: "#352A14",
    lightinfo: "#15293A",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    borderColor: "#334155",
    inputBorder: "#475569",
    containerBg: "#0F172A",
    hoverColor: "#1E293B",
    surface: "#1E293B",
    "on-surface-variant": "#1E293B",
    grey100: "#1E293B",
    grey200: "#152032",
    // Paleta de gráficos: mismos hues, escalonados para el fondo oscuro.
    chartPrimary: "#6B9BF2",
    chartSecondary: "#45C9BE",
    chartInfo: "#5CC7E4",
    chartSuccess: "#63C495",
    chartWarning: "#E8A45C",
    chartError: "#E88585",
    chartAccent: "#A99BF0",
    chartAmber: "#E9C766",
    chartGrey: "#94A3B8",
  },
};
export { FleetDark };
