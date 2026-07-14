// Opciones base para los gráficos de barras horizontales de los tableros
// (Combustible, Indicadores). Antes esta fábrica estaba duplicada, idéntica, en
// cada página. Usa la paleta suave de gráficos (useChartColors) y, cuando el eje
// representa dinero, lo compacta en miles ("$250k") con tooltip en monto completo.
export const useBarChart = () => {
  const { chartHex } = useChartColors();
  const { money, moneyK } = useFormatters();

  const barOptions = (
    color: string,
    categories: string[],
    asMoney = false,
  ) => ({
    chart: {
      type: "bar" as const,
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    xaxis: {
      categories,
      labels: asMoney ? { formatter: moneyK } : {},
    },
    colors: [chartHex(color)],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
    dataLabels: { enabled: false },
    grid: { borderColor: "rgba(0,0,0,0.06)" },
    tooltip: asMoney ? { y: { formatter: (v: number) => money(v) } } : {},
  });

  return { barOptions };
};
