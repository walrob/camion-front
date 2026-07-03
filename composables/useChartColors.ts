// Resuelve nombres de color semánticos (los mismos que usan chips y estados del
// dominio: "primary", "success", "warning"...) a la paleta SUAVE de gráficos
// definida en el tema (chartPrimary, chartSuccess, ...). Así los charts comparten
// la semántica de la UI pero se pintan con tintes más claros y armónicos —evitando
// el aspecto saturado/"arcoíris"— sin tocar el contraste de botones ni chips.
import { useTheme } from "vuetify";

const CHART_TOKEN: Record<string, string> = {
  primary: "chartPrimary",
  secondary: "chartSecondary",
  info: "chartInfo",
  success: "chartSuccess",
  warning: "chartWarning",
  error: "chartError",
  accent: "chartAccent",
  amber: "chartAmber",
  grey: "chartGrey",
};

export const useChartColors = () => {
  const theme = useTheme();

  // name puede ser un nombre semántico ("primary"), un token de gráfico directo
  // ("chartInfo") o un hex crudo ("#94A3B8"): se resuelve en ese orden.
  const chartHex = (name: string): string => {
    const colors = theme.current.value.colors as Record<string, string>;
    const token = CHART_TOKEN[name];
    return (token && colors[token]) || colors[name] || name;
  };

  return { chartHex };
};
