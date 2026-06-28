import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export const useIndicatorStore = defineStore("indicator", {
  state: () => ({
    summary: null as any,
    loading: false,
    truckOptions: [] as any[],
    driverOptions: [] as any[],
    fleetOptions: [] as any[],
    filters: {
      truckId: "" as string,
      driverId: "" as string,
      fleetId: "" as string,
      from: "" as string,
      to: "" as string,
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

    async getSummary() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("indicators/summary/", { params: this.cleanParams() })
        .then((resp) => (this.summary = resp.data))
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
        const resp = await $api.get("indicators/export/", {
          params: this.cleanParams(),
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([resp.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "indicadores.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        general.setErrorSnackbar(e);
      }
    },
  },
});
