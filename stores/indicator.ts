import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import { lastNDaysRange } from "~/composables/useDateRange";

/** Paso de las series temporales. `null` = lo elige el backend según la ventana. */
export type SeriesBucket = "day" | "week" | "month";

export const bucketOptions: { value: SeriesBucket | null; label: string }[] = [
  { value: null, label: "Auto" },
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

/** Un punto de la serie temporal. Los ratios van en `null` si no hubo km. */
export interface SeriesPoint {
  period: string;
  expenses: number;
  distanceKm: number;
  liters: number;
  trips: number;
  costPerKm: number | null;
  fuelEfficiency: number | null;
}

/** Fila de los cortes normalizados (por camión, por ruta). */
export interface EfficiencyRow {
  key: string | null;
  expenses: number;
  distanceKm: number;
  liters: number;
  trips: number;
  costPerKm: number | null;
  fuelEfficiency: number | null;
}

export interface ExpenseTypeSeries {
  key: string;
  total: number;
  data: number[];
}

export const useIndicatorStore = defineStore("indicator", {
  state: () => {
    // Rango precargado: últimos 30 días (from/to siempre se envían al back).
    const { from, to } = lastNDaysRange(30);
    return {
      summary: null as any,
      loading: false,
      // Detalle completo de gastos (modal "Ver todos"); se pide bajo demanda.
      expenseDetail: [] as { key: string; total: number }[],
      detailLoading: false,
      // ── Series y cortes normalizados ──
      series: [] as SeriesPoint[],
      seriesBucket: null as SeriesBucket | null,
      byType: { periods: [] as string[], series: [] as ExpenseTypeSeries[] },
      efficiency: [] as EfficiencyRow[],
      routes: [] as EfficiencyRow[],
      trendsLoading: false,
      /** Paso pedido por el usuario; `null` deja elegir al backend. */
      bucket: null as SeriesBucket | null,
      truckOptions: [] as any[],
      driverOptions: [] as any[],
      fleetOptions: [] as any[],
      filters: {
        truckId: null as string | null,
        driverId: null as string | null,
        fleetId: null as string | null,
        from: from as string | null,
        to: to as string | null,
      },
    };
  },

  actions: {
    cleanParams() {
      const p: Record<string, string> = {};
      Object.entries(this.filters).forEach(([k, v]) => {
        if (v) p[k] = v as string;
      });
      return p;
    },

    async getSummary() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("indicators/summary/", { params: this.cleanParams() })
        .then((resp) => (this.summary = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    /**
     * Todo lo que depende del filtro: los KPIs y los cuatro cortes analíticos.
     *
     * Van juntos y en paralelo porque comparten ventana: pedirlos por separado
     * dejaría la página con la mitad de los gráficos de un período y la otra
     * mitad de otro mientras carga.
     */
    async getAll() {
      await Promise.all([this.getSummary(), this.getTrends()]);
    },

    async getTrends() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      const params = this.cleanParams();
      const conBucket = this.bucket
        ? { ...params, bucket: this.bucket }
        : params;
      this.trendsLoading = true;
      try {
        const [series, byType, efficiency, routes] = await Promise.all([
          $api.get("indicators/series/", { params: conBucket }),
          $api.get("indicators/by-type/", { params: conBucket }),
          $api.get("indicators/efficiency/", { params }),
          $api.get("indicators/routes/", { params }),
        ]);
        this.series = series.data.points;
        this.seriesBucket = series.data.bucket;
        this.byType = { periods: byType.data.periods, series: byType.data.series };
        this.efficiency = efficiency.data;
        this.routes = routes.data;
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.trendsLoading = false;
      }
    },

    // Lista completa de gastos por camión/chofer, según el filtro aplicado.
    async getExpenseDetail(group: "truck" | "driver") {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.detailLoading = true;
      this.expenseDetail = [];
      return await $api
        .get("indicators/expenses/", {
          params: { ...this.cleanParams(), group },
        })
        .then((resp) => (this.expenseDetail = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.detailLoading = false));
    },

    async loadOptions() {
      const { $api } = useNuxtApp();
      const [trucks, drivers, fleets] = await Promise.all([
        $api.get("trucks/", { params: { limit: 100 } }),
        $api.get("drivers/", { params: { limit: 100 } }),
        $api.get("fleets/all/"),
      ]);
      this.truckOptions = trucks.data.items;
      this.driverOptions = drivers.data.items;
      this.fleetOptions = fleets.data;
    },

    async exportXlsx() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.get("indicators/export/", {
          params: this.cleanParams(),
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([resp.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "indicadores.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        general.setErrorSnackbar(e);
      }
    },
  },
});
