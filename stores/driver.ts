import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Driver } from "~/types/fleet";
import type { Employee } from "~/types/hr";

export const useDriverStore = defineStore("driver", {
  state: () => ({
    drivers: [] as Driver[],
    // Empleados con puesto "Chofer" disponibles para crear un chofer.
    employeeOptions: [] as Employee[],
    loadingEmployeeOptions: false,
    loading: false,
    error: false,
    search: null as string | null,
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
    async getDrivers() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      this.error = false;
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
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    // Empleados con puesto "Chofer" para el selector del alta de chofer.
    async loadEmployeeOptions() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loadingEmployeeOptions = true;
      return await $api
        .get("hr/employees/", { params: { position: "driver", limit: 100 } })
        .then((resp) => (this.employeeOptions = resp.data.items))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loadingEmployeeOptions = false));
    },

    async createDriver(payload: Record<string, any>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      await $api.post("drivers/", payload);
      general.setSuccessSnackbar("Chofer creado");
      await this.getDrivers();
    },

    async updateDriver(id: string, payload: Partial<Driver>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      await $api.patch(`drivers/${id}/`, payload);
      general.setSuccessSnackbar("Chofer actualizado");
      await this.getDrivers();
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
