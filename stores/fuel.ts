import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export interface FuelTruckRow {
  truckId: string;
  plate: string;
  loads: number;
  totalLiters: number;
  totalCost: number;
  avgPricePerLiter: number;
  avgLitersPerLoad: number;
  avgCostPerLoad: number;
  avgKmBetweenLoads: number | null;
  avgDaysBetweenLoads: number | null;
  lastLoadAt: string | null;
  lastOdometerKm: number | null;
  distanceKm: number;
  litersPer100Km: number | null;
  kmPerLiter: number | null;
  costPerKm: number | null;
}

export interface FuelDriverRow {
  driverId: string;
  driver: string;
  loads: number;
  totalLiters: number;
  totalCost: number;
  avgPricePerLiter: number;
  avgLitersPerLoad: number;
  avgCostPerLoad: number;
  distanceKm: number;
  litersPer100Km: number | null;
  kmPerLiter: number | null;
  costPerKm: number | null;
}

export interface FuelReport {
  totalLiters: number;
  totalCost: number;
  loads: number;
  avgPricePerLiter: number;
  totalDistanceKm: number;
  fleetKmPerLiter: number | null;
  fleetLitersPer100Km: number | null;
  fleetCostPerKm: number | null;
  byTruck: FuelTruckRow[];
  byDriver: FuelDriverRow[];
}

export const useFuelStore = defineStore("fuel", {
  state: () => ({
    report: null as FuelReport | null,
    myLoads: [] as any[],
    loading: false,
    saving: false,
    truckOptions: [] as any[],
    driverOptions: [] as any[],
    fleetOptions: [] as any[],
    filters: {
      truckId: null as string | null,
      driverId: null as string | null,
      fleetId: null as string | null,
      from: null as string | null,
      to: null as string | null,
    },
  }),

  actions: {
    cleanParams() {
      const p: Record<string, string> = {};
      Object.entries(this.filters).forEach(([k, v]) => {
        if (v) p[k] = v as string;
      });
      return p;
    },

    async getReport() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("fuel/report/", { params: this.cleanParams() })
        .then((resp) => (this.report = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
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
        const resp = await $api.get("fuel/report/export/", {
          params: this.cleanParams(),
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([resp.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "combustible.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        general.setErrorSnackbar(e);
      }
    },

    // ───────── Chofer ─────────
    async getMine() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        const resp = await $api.get("fuel/me/");
        this.myLoads = resp.data;
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    async createLoad(payload: Record<string, any>, file?: File | null) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      try {
        const resp = await $api.post("fuel/", payload);
        if (file) await this.uploadAttachment("fuel_record", resp.data.id, file);
        general.setSuccessSnackbar("Carga de combustible registrada");
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      } finally {
        this.saving = false;
      }
    },

    async uploadAttachment(entityType: string, entityId: string, file: File) {
      const { $api } = useNuxtApp();
      const form = new FormData();
      form.append("file", file);
      form.append("entityType", entityType);
      form.append("entityId", entityId);
      const resp = await $api.post("attachments/upload/", form);
      return resp.data;
    },
  },
});
