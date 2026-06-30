import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Trip } from "~/types/trip";
import type { Truck, Trailer, Driver } from "~/types/fleet";

export const useTripStore = defineStore("trip", {
  state: () => ({
    // Chofer
    myTrips: [] as Trip[],
    trip: null as Trip | null,
    // Backoffice
    trips: [] as Trip[],
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
    // Opciones para el formulario de asignación
    truckOptions: [] as Truck[],
    trailerOptions: [] as Trailer[],
    driverOptions: [] as Driver[],
  }),

  actions: {
    // ───────── Chofer ─────────
    async getMyTrips() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("trips/me/")
        .then((resp) => (this.myTrips = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async getMyTrip(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get(`trips/me/${id}/`)
        .then((resp) => (this.trip = resp.data))
        .catch((e) => general.setErrorSnackbar(e));
    },

    async startTrip(id: string, payload: { startOdometerKm: number; lat?: number; lng?: number }) {
      return this.action("post", `trips/${id}/start/`, payload, "Viaje iniciado");
    },

    async finishTrip(id: string, payload: { endOdometerKm: number; lat?: number; lng?: number }) {
      return this.action("post", `trips/${id}/finish/`, payload, "Viaje finalizado");
    },

    // ───────── Backoffice ─────────
    async getTrips() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      this.error = false;
      return await $api
        .get("trips/", {
          params: {
            page: this.pagination.currentPage,
            limit: this.pagination.itemsPerPage,
            search: this.search || undefined,
            status: this.filterStatus || undefined,
          },
        })
        .then((resp) => {
          this.trips = resp.data.items;
          this.pagination = resp.data.meta;
        })
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    async createTrip(payload: Partial<Trip>) {
      return this.action("post", "trips/", payload, "Viaje creado", () => this.getTrips(), true);
    },

    async updateTrip(id: string, payload: Partial<Trip>) {
      return this.action(
        "patch",
        `trips/${id}/`,
        payload,
        "Viaje actualizado",
        () => this.getTrips(),
        true,
      );
    },

    async cancelTrip(id: string) {
      return this.action("post", `trips/${id}/cancel/`, null, "Viaje cancelado", () =>
        this.getTrips(),
      );
    },

    async deleteTrip(id: string) {
      return this.action("delete", `trips/${id}/`, null, "Viaje eliminado", () =>
        this.getTrips(),
      );
    },

    // ───────── Opciones ─────────
    async loadFormOptions() {
      const { $api } = useNuxtApp();
      const [trucks, trailers, drivers] = await Promise.all([
        $api.get("trucks/", { params: { limit: 100 } }),
        $api.get("trailers/", { params: { limit: 100 } }),
        $api.get("drivers/", { params: { limit: 100 } }),
      ]);
      this.truckOptions = trucks.data.items;
      this.trailerOptions = trailers.data.items;
      this.driverOptions = drivers.data.items;
    },

    async action(
      method: "post" | "patch" | "delete",
      url: string,
      payload: any,
      successMsg: string,
      refresh?: () => Promise<any>,
      // Si es true, propaga el error (para mapear validación a campos en el form).
      throwOnError = false,
    ): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        if (method === "delete") await $api.delete(url);
        else await ($api as any)[method](url, payload);
        general.setSuccessSnackbar(successMsg);
        if (refresh) await refresh();
        return true;
      } catch (e) {
        if (throwOnError) throw e;
        general.setErrorSnackbar(e);
        return false;
      }
    },
  },
});
