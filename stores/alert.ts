import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import { ALERT_LEVEL_PRIORITY } from "~/composables/useAlertStatus";
import { lastNDaysRange } from "~/composables/useDateRange";

export interface Alert {
  id: string;
  level: string;
  sourceType: string;
  sourceId?: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

export const useAlertStore = defineStore("alert", {
  state: () => {
    // Rango precargado: últimos 15 días (from/to siempre se envían al back).
    const { from, to } = lastNDaysRange(15);
    return {
      alerts: [] as Alert[],
      activeCount: 0,
      loading: false,
      filterLevel: null as string | null,
      filterStatus: null as string | null,
      filterFrom: from as string | null,
      filterTo: to as string | null,
    };
  },

  getters: {
    sorted: (state) =>
      [...state.alerts].sort((a, b) => {
        const p =
          (ALERT_LEVEL_PRIORITY[a.level] ?? 9) -
          (ALERT_LEVEL_PRIORITY[b.level] ?? 9);
        if (p !== 0) return p;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
  },

  actions: {
    async getAlerts() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("alerts/", {
          params: {
            level: this.filterLevel || undefined,
            status: this.filterStatus || undefined,
            from: this.filterFrom || undefined,
            to: this.filterTo || undefined,
          },
        })
        .then((resp) => (this.alerts = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async getCount() {
      const { $api } = useNuxtApp();
      try {
        const resp = await $api.get("alerts/count/");
        this.activeCount =
          typeof resp.data === "number" ? resp.data : (resp.data?.count ?? 0);
      } catch {
        /* noop */
      }
    },

    async setStatus(id: string, action: "seen" | "acknowledge" | "resolve") {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.patch(`alerts/${id}/${action}/`);
        this.upsert(resp.data);
        await this.getCount();
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    upsert(alert: Alert) {
      const idx = this.alerts.findIndex((a) => a.id === alert.id);
      if (idx >= 0) this.alerts[idx] = alert;
      else this.alerts.unshift(alert);
    },
  },
});
