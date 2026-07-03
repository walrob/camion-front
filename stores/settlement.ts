import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Settlement } from "~/types/trip";

export const useSettlementStore = defineStore("settlement", {
  state: () => ({
    settlements: [] as Settlement[],
    finishedTrips: [] as any[],
    loading: false,
    error: false,
    filterStatus: null as string | null,
    pagination: {
      totalItems: 0,
      itemCount: 0,
      itemsPerPage: 10,
      totalPages: 0,
      currentPage: 1,
    },
  }),

  actions: {
    async getSettlements() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      this.error = false;
      return await $api
        .get("settlements/", {
          params: {
            page: this.pagination.currentPage,
            limit: this.pagination.itemsPerPage,
            status: this.filterStatus || undefined,
          },
        })
        .then((resp) => {
          this.settlements = resp.data.items;
          this.pagination = resp.data.meta;
        })
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    async loadFinishedTrips() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get("trips/", { params: { status: "finished", limit: 100 } })
        .then((resp) => (this.finishedTrips = resp.data.items))
        .catch((e) => general.setErrorSnackbar(e));
    },

    async generate(tripId: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        await $api.post(`settlements/trip/${tripId}/generate/`);
        general.setSuccessSnackbar("Rendición generada");
        await this.getSettlements();
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async close(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        await $api.post(`settlements/${id}/close/`);
        general.setSuccessSnackbar("Rendición cerrada");
        await this.getSettlements();
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async openPdf(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.get(`settlements/${id}/pdf/`);
        if (resp.data?.url) window.open(resp.data.url, "_blank");
      } catch (e) {
        general.setErrorSnackbar(e);
      }
    },
  },
});
