import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Settlement } from "~/types/trip";

export const useSettlementStore = defineStore("settlement", {
  state: () => ({
    settlements: [] as Settlement[],
    pendingTrips: [] as any[],
    loading: false,
    error: false,
    search: "",
    filterStatus: null as string | null,
    sortBy: null as string | null,
    sortOrder: null as "asc" | "desc" | null,
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
            search: this.search || undefined,
            status: this.filterStatus || undefined,
            sortBy: this.sortBy || undefined,
            order: this.sortOrder || undefined,
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

    // Orden por columna (server-side): guarda el criterio y recarga desde la
    // primera página. `key` nulo = se quitó el orden (vuelve al default del back).
    setSort(sort: { key: string | null; order: "asc" | "desc" | null }) {
      this.sortBy = sort.key;
      this.sortOrder = sort.order;
      this.pagination.currentPage = 1;
      this.getSettlements();
    },

    // Viajes que se pueden rendir por primera vez: finalizados y sin
    // liquidación. El filtro lo hace el back (los ya rendidos están en la tabla
    // de esta misma pantalla; recalcularlos es una acción sobre esa fila).
    async loadPendingTrips() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get("settlements/pending-trips/")
        .then((resp) => (this.pendingTrips = resp.data))
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
