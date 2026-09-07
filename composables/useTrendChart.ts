// Opciones de los gráficos con eje temporal de los tableros: la línea de
// evolución y la barra apilada de composición. Comparten la paleta suave
// (useChartColors) y el formato de moneda de la empresa (useFormatters), igual
// que las barras horizontales de useBarChart.
//
// El eje X de estos gráficos son las etiquetas de bucket que arma el backend
// ("2026-09" para el mes, "2026-09-07" para el día o el lunes de la semana).
// `formatPeriod` es el único lugar donde se traducen a algo legible: si cada
// página lo hiciera a mano, dos gráficos del mismo período mostrarían fechas
// distintas.
import type { SeriesBucket } from "~/stores/indicator";

export const useTrendChart = () => {
  const { chartHex } = useChartColors();
  const { money, moneyK, num, locale } = useFormatters();

  /** Etiqueta legible de un bucket, según el paso de la serie. */
  const formatPeriod = (period: string, bucket?: SeriesBucket | null) => {
    if (!period) return "";
    const [y, m, d] = period.split("-");
    if (!d) {
      // Mes: "sept 26".
      const fecha = new Date(Number(y), Number(m) - 1, 1);
      return fecha.toLocaleDateString(locale(), {
        month: "short",
        year: "2-digit",
      });
    }
    const corta = `${d}/${m}`;
    // La semana se etiqueta con su lunes; aclararlo evita leerla como un día.
    return bucket === "week" ? `sem ${corta}` : corta;
  };

  const grilla = {
    borderColor: "rgba(0,0,0,0.06)",
    strokeDashArray: 4,
    padding: { left: 4, right: 4 },
  };

  /**
   * Línea de evolución. `asMoney` compacta el eje en miles y muestra el monto
   * completo en el tooltip; `decimals` sirve para los ratios (costo por km,
   * l/100km), donde redondear a entero borra la variación que se quiere ver.
   *
   * `nullAsGap` mantiene el corte de la línea en los períodos sin dato: unir
   * los extremos dibujaría una pendiente que nunca ocurrió.
   */
  const lineOptions = (
    categories: string[],
    {
      color = "primary",
      asMoney = false,
      decimals = 0,
      bucket = null as SeriesBucket | null,
    } = {},
  ) => ({
    chart: {
      type: "line" as const,
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [chartHex(color)],
    stroke: { width: 3, curve: "straight" as const },
    markers: { size: categories.length <= 20 ? 4 : 0, hover: { size: 6 } },
    dataLabels: { enabled: false },
    grid: grilla,
    xaxis: {
      categories: categories.map((c) => formatPeriod(c, bucket)),
      tooltip: { enabled: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (v: number) =>
          asMoney ? moneyK(v) : Number(v ?? 0).toFixed(decimals),
      },
    },
    tooltip: {
      y: {
        formatter: (v: number) =>
          v == null
            ? "Sin datos"
            : asMoney
              ? money(v)
              : Number(v).toLocaleString(locale(), {
                  maximumFractionDigits: decimals,
                }),
      },
    },
  });

  /**
   * Barra apilada de composición: una serie por categoría, un tramo por
   * período. Es la forma correcta para "de qué está hecho el total y cómo
   * cambia"; una torta muestra la composición de un instante y pierde el
   * tiempo, que acá es la mitad de la información.
   */
  const stackedOptions = (
    categories: string[],
    colors: string[],
    { asMoney = true, bucket = null as SeriesBucket | null } = {},
  ) => ({
    chart: {
      type: "bar" as const,
      stacked: true,
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    colors: colors.map(chartHex),
    plotOptions: {
      bar: { columnWidth: "60%", borderRadius: 3, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    legend: { position: "bottom" as const, markers: { radius: 4 } },
    grid: grilla,
    xaxis: {
      categories: categories.map((c) => formatPeriod(c, bucket)),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (v: number) => (asMoney ? moneyK(v) : num(v)) },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (v: number) => (asMoney ? money(v) : num(v)) },
    },
  });

  /**
   * Barra horizontal apilada de una sola fila: para un conteo ordinal corto
   * —severidades, ventanas de vencimiento— donde la torta desordena la
   * secuencia y gasta media pantalla en cuatro números.
   */
  const stripOptions = (colors: string[]) => ({
    chart: {
      type: "bar" as const,
      stacked: true,
      stackType: "100%" as const,
      fontFamily: "inherit",
      toolbar: { show: false },
      sparkline: { enabled: true },
    },
    colors: colors.map(chartHex),
    plotOptions: { bar: { horizontal: true, barHeight: "100%" } },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: { categories: [""], labels: { show: false } },
    yaxis: { labels: { show: false } },
    tooltip: { y: { formatter: (v: number) => num(v) } },
  });

  return { formatPeriod, lineOptions, stackedOptions, stripOptions };
};
