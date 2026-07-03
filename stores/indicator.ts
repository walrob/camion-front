import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import { lastNDaysRange } from "~/composables/useDateRange";

export const useIndicatorStore = defineStore("indicator", {
  state: () => {
    // Rango precargado: últimos 30 días (from/to siempre se envían al back).
    const { from, to } = lastNDaysRange(30);
    return {
      summary: null as any,
      loading: false,
      // Detalle completo de gastos (modal "Ver todos"); se pide bajo demanda.
      expenseDetail: [] as { key: string; total: number }[],
      detailLoading: false,
      truckOptions: [] as any[],
      driverOptions: [] as any[],
      fleetOptions: [] as any[],
      filters: {
        truckId: null as string | null,
        driverId: null as string | null,
        fleetId: null as string | null,
        from: from as string | null,
        to: to as string | null,
      },
    };
  },

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

    // Lista completa de gastos por camión/chofer, según el filtro aplicado.
    async getExpenseDetail(group: "truck" | "driver") {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.detailLoading = true;
      this.expenseDetail = [];
      return await $api
        .get("indicators/expenses/", {
          params: { ...this.cleanParams(), group },
        })
        .then((resp) => (this.expenseDetail = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.detailLoading = false));
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
