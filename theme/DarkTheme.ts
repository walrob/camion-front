import type { ThemeTypes } from "@/types/themeTypes/ThemeType";

const DarkTheme: ThemeTypes = {
  name: "DarkTheme",
  dark: true,
  variables: {
    "hover-table": "#686b6c",
    "border-color": "#525966",
    "carousel-control-size": 10,
  },
  colors: {
    primary: "#5D87FF",
    secondary: "#49BEFF",
    info: "#539BFF",
    success: "#13DEB9",
    accent: "#FFAB91",
    warning: "#FFAE1F",
    error: "#FA896B",
    muted: "#b0b8c1",
    lightprimary: "#232a36",
    lightsecondary: "#1e2633",
    lightsuccess: "#1a2e2b",
    lighterror: "#3a2320",
    lightwarning: "#3a2f1e",
    lightinfo: "#232d36",
    textPrimary: "#F3F6F9",
    textSecondary: "#B0B8C1",
    borderColor: "#525966",
    inputBorder: "#5f656d",
    containerBg: "#181c23",
    hoverColor: "#23272e",
    surface: "#23272e",
    "on-surface-variant": "#23272e",
    grey100: "#232a36",
    grey200: "#1e2633",
  },
};
export { DarkTheme };
