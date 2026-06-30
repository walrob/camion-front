import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Truck, Trailer, Fleet } from "~/types/fleet";

const emptyPagination = () => ({
  totalItems: 0,
  itemCount: 0,
  itemsPerPage: 10,
  totalPages: 0,
  currentPage: 1,
});

export const useFleetStore = defineStore("fleet", {
  state: () => ({
    trucks: [] as Truck[],
    trailers: [] as Trailer[],
    fleets: [] as Fleet[],
    fleetOptions: [] as Fleet[],

    loadingTrucks: false,
    loadingTrailers: false,
    loadingFleets: false,

    errorTrucks: false,
    errorTrailers: false,
    errorFleets: false,

    searchTrucks: null as string | null,
    searchTrailers: null as string | null,
    searchFleets: null as string | null,

    filterTruckStatus: null as string | null,
    filterTruckFleetId: null as string | null,
    filterTrailerStatus: null as string | null,

    paginationTrucks: emptyPagination(),
    paginationTrailers: emptyPagination(),
    paginationFleets: emptyPagination(),
  }),

  actions: {
    // ───────── Camiones ─────────
    async getTrucks() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loadingTrucks = true;
      this.errorTrucks = false;
      return await $api
        .get("trucks/", {
          params: {
            page: this.paginationTrucks.currentPage,
            limit: this.paginationTrucks.itemsPerPage,
            search: this.searchTrucks || undefined,
            status: this.filterTruckStatus || undefined,
            fleetId: this.filterTruckFleetId || undefined,
          },
        })
        .then((resp) => {
          this.trucks = resp.data.items;
          this.paginationTrucks = resp.data.meta;
        })
        .catch((e) => {
          this.errorTrucks = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loadingTrucks = false));
    },

    // Propagan el error (no lo tragan) para que el formulario pueda mapear
    // validaciones 422 a los campos vía useFormErrors. El snackbar lo muestra
    // el form en su catch.
    async createTruck(payload: Partial<Truck>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      await $api.post("trucks/", payload);
      general.setSuccessSnackbar("Camión creado");
      await this.getTrucks();
    },

    async updateTruck(id: string, payload: Partial<Truck>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      await $api.patch(`trucks/${id}/`, payload);
      general.setSuccessSnackbar("Camión actualizado");
      await this.getTrucks();
    },

    async deleteTruck(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .delete(`trucks/${id}/`)
        .then(async () => {
          general.setSuccessSnackbar("Camión eliminado");
          await this.getTrucks();
        })
        .catch((e) => general.setErrorSnackbar(e));
    },

    // ───────── Acoplados ─────────
    async getTrailers() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loadingTrailers = true;
      this.errorTrailers = false;
      return await $api
        .get("trailers/", {
          params: {
            page: this.paginationTrailers.currentPage,
            limit: this.paginationTrailers.itemsPerPage,
            search: this.searchTrailers || undefined,
            status: this.filterTrailerStatus || undefined,
          },
        })
        .then((resp) => {
          this.trailers = resp.data.items;
          this.paginationTrailers = resp.data.meta;
        })
        .catch((e) => {
          this.errorTrailers = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loadingTrailers = false));
    },

    async createTrailer(payload: Partial<Trailer>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      await $api.post("trailers/", payload);
      general.setSuccessSnackbar("Acoplado creado");
      await this.getTrailers();
    },

    async updateTrailer(id: string, payload: Partial<Trailer>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      await $api.patch(`trailers/${id}/`, payload);
      general.setSuccessSnackbar("Acoplado actualizado");
      await this.getTrailers();
    },

    async deleteTrailer(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .delete(`trailers/${id}/`)
        .then(async () => {
          general.setSuccessSnackbar("Acoplado eliminado");
          await this.getTrailers();
        })
        .catch((e) => general.setErrorSnackbar(e));
    },

    // ───────── Flotas ─────────
    async getFleets() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loadingFleets = true;
      this.errorFleets = false;
      return await $api
        .get("fleets/", {
          params: {
            page: this.paginationFleets.currentPage,
            limit: this.paginationFleets.itemsPerPage,
            search: this.searchFleets || undefined,
          },
        })
        .then((resp) => {
          this.fleets = resp.data.items;
          this.paginationFleets = resp.data.meta;
        })
        .catch((e) => {
          this.errorFleets = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loadingFleets = false));
    },

    async getFleetOptions() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get("fleets/all/")
        .then((resp) => (this.fleetOptions = resp.data))
        .catch((e) => general.setErrorSnackbar(e));
    },

    async createFleet(payload: Partial<Fleet>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      await $api.post("fleets/", payload);
      general.setSuccessSnackbar("Flota creada");
      await this.getFleets();
    },

    async updateFleet(id: string, payload: Partial<Fleet>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      await $api.patch(`fleets/${id}/`, payload);
      general.setSuccessSnackbar("Flota actualizada");
      await this.getFleets();
    },

    async deleteFleet(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .delete(`fleets/${id}/`)
        .then(async () => {
          general.setSuccessSnackbar("Flota eliminada");
          await this.getFleets();
        })
        .catch((e) => general.setErrorSnackbar(e));
    },
  },
});
