import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

/** Ventana del bloque de tendencias del panel. */
export type DashboardRange = "today" | "7d" | "30d";

export const dashboardRangeOptions: { value: DashboardRange; label: string }[] =
  [
    { value: "today", label: "Hoy" },
    { value: "7d", label: "7 días" },
    { value: "30d", label: "30 días" },
  ];

/**
 * Métrica del período con su comparación: el valor, el del período anterior de
 * igual duración y la serie diaria para el sparkline.
 */
export interface TrendMetric {
  value: number;
  previousValue: number;
  series: number[];
}

export interface Overview {
  range: DashboardRange;
  trucksByStatus: Record<string, number>;
  incidents: { open: number; bySeverity: Record<string, number> };
  alerts: { active: number; byLevel: Record<string, number> };
  /**
   * `null` = no incluido en el plan, distinto de 0. La tarjeta muestra candado
   * y no un importe en cero, que sería un dato falso.
   */
  todayExpenses: number | null;
  delayedTrips: number;
  driversWithNews: number;
  upcomingMaintenance: number | null;
  trends: {
    /** `null` cuando el plan no incluye la bitácora. */
    expenses: TrendMetric | null;
    tripsFinished: TrendMetric;
    incidentsReported: TrendMetric;
  };
  /** Documentos por vencer en ventanas excluyentes de urgencia. */
  expirations: { expired: number; in7: number; in30: number; in90: number };
}

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    overview: null as Overview | null,
    loading: false,
    range: "7d" as DashboardRange,
  }),

  actions: {
    async getOverview(range?: DashboardRange) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      if (range) this.range = range;
      this.loading = true;
      return await $api
        .get("dashboard/overview/", { params: { range: this.range } })
        .then((resp) => (this.overview = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },
  },
});
