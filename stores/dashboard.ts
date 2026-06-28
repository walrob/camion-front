import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export interface Overview {
  trucksByStatus: Record<string, number>;
  incidents: { open: number; bySeverity: Record<string, number> };
  alerts: { active: number; byLevel: Record<string, number> };
  todayExpenses: number;
  delayedTrips: number;
  driversWithNews: number;
  upcomingMaintenance: number;
}

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    overview: null as Overview | null,
    loading: false,
  }),

  actions: {
    async getOverview() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("dashboard/overview/")
        .then((resp) => (this.overview = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },
  },
});
