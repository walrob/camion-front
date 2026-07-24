import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Truck } from "~/types/fleet";

export const useMaintenanceStore = defineStore("maintenance", {
  state: () => ({
    plans: [] as any[],
    upcoming: [] as any[],
    orders: [] as any[],
    truckOptions: [] as Truck[],
    selectedTruckId: null as string | null,
    loading: false,
    error: false,
  }),

  actions: {
    // Abre el PDF de la orden de trabajo en una pestaña nueva para ver/imprimir.
    async openOrderPdf(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.get(`maintenance/orders/${id}/pdf/`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(
          new Blob([resp.data], { type: "application/pdf" }),
        );
        window.open(url, "_blank");
      } catch (e) {
        general.setErrorSnackbar(e);
      }
    },

    async getPlans() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      this.error = false;
      return await $api
        .get("maintenance/plans/")
        .then((resp) => (this.plans = resp.data))
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    async getUpcoming() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get("maintenance/plans/upcoming/")
        .then((resp) => (this.upcoming = resp.data))
        .catch((e) => general.setErrorSnackbar(e));
    },

    async getOrders(truckId: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      this.error = false;
      return await $api
        .get(`maintenance/trucks/${truckId}/orders/`)
        .then((resp) => (this.orders = resp.data))
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    async getTruckOptions() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get("trucks/", { params: { limit: 100 } })
        .then((resp) => (this.truckOptions = resp.data.items))
        .catch((e) => general.setErrorSnackbar(e));
    },

    async createPlan(payload: any) {
      return this.mutate("post", "maintenance/plans/", payload, "Plan creado", () => this.getPlans(), true);
    },
    async updatePlan(id: string, payload: any) {
      return this.mutate("patch", `maintenance/plans/${id}/`, payload, "Plan actualizado", () => this.getPlans(), true);
    },
    async deletePlan(id: string) {
      return this.mutate("delete", `maintenance/plans/${id}/`, null, "Plan eliminado", () =>
        this.getPlans(),
      );
    },

    async createOrder(payload: any) {
      return this.mutate("post", "maintenance/orders/", payload, "OT creada", () => this.getOrders(payload.truckId), true);
    },
    async updateOrder(id: string, truckId: string, payload: any) {
      return this.mutate("patch", `maintenance/orders/${id}/`, payload, "OT actualizada", () => this.getOrders(truckId), true);
    },

    async mutate(
      method: "post" | "patch" | "delete",
      url: string,
      payload: any,
      msg: string,
      refresh: () => Promise<any>,
      throwOnError = false,
    ): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        if (method === "delete") await $api.delete(url);
        else await ($api as any)[method](url, payload);
        general.setSuccessSnackbar(msg);
        await refresh();
        return true;
      } catch (e) {
        if (throwOnError) throw e;
        general.setErrorSnackbar(e);
        return false;
      }
    },
  },
});
