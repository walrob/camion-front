import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Driver } from "~/types/fleet";

export const useDriverStore = defineStore("driver", {
  state: () => ({
    drivers: [] as Driver[],
    loading: false,
    search: "",
    filterStatus: "" as string,
    pagination: {
      totalItems: 0,
      itemCount: 0,
      itemsPerPage: 10,
      totalPages: 0,
      currentPage: 1,
    },
  }),

  actions: {
    async getDrivers() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("drivers/", {
          params: {
            page: this.pagination.currentPage,
            limit: this.pagination.itemsPerPage,
            search: this.search || undefined,
            status: this.filterStatus || undefined,
          },
        })
        .then((resp) => {
          this.drivers = resp.data.items;
          this.pagination = resp.data.meta;
        })
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async createDriver(payload: Record<string, any>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .post("drivers/", payload)
        .then(async () => {
          general.setSuccessSnackbar("Chofer creado");
          await this.getDrivers();
          return true;
        })
        .catch((e) => {
          general.setErrorSnackbar(e);
          return false;
        });
    },

    async updateDriver(id: string, payload: Partial<Driver>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .patch(`drivers/${id}/`, payload)
        .then(async () => {
          general.setSuccessSnackbar("Chofer actualizado");
          await this.getDrivers();
          return true;
        })
        .catch((e) => {
          general.setErrorSnackbar(e);
          return false;
        });
    },

    async deleteDriver(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .delete(`drivers/${id}/`)
        .then(async () => {
          general.setSuccessSnackbar("Chofer eliminado");
          await this.getDrivers();
        })
        .catch((e) => general.setErrorSnackbar(e));
    },
  },
});
