import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { TripLogEntry, TripLogSummary } from "~/types/trip";

export const useTripLogStore = defineStore("tripLog", {
  state: () => ({
    entries: [] as TripLogEntry[],
    summary: null as TripLogSummary | null,
    loading: false,
  }),

  actions: {
    async getEntries(tripId: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        const [entries, summary] = await Promise.all([
          $api.get(`trip-log/me/trip/${tripId}/`),
          $api.get(`trip-log/me/trip/${tripId}/summary/`),
        ]);
        this.entries = entries.data;
        this.summary = summary.data;
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    /** Crea una entrada y, si hay foto, la sube al módulo attachments. */
    async createEntry(payload: Partial<TripLogEntry>, file?: File | null) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.post("trip-log/", payload);
        const entry = resp.data;
        if (file && entry?.id) {
          const form = new FormData();
          form.append("file", file);
          form.append("entityType", "trip_log_entry");
          form.append("entityId", entry.id);
          await $api.post("attachments/upload/", form);
        }
        general.setSuccessSnackbar("Gasto registrado");
        await this.getEntries(payload.tripId as string);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async deleteEntry(id: string, tripId: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        await $api.delete(`trip-log/${id}/`);
        general.setSuccessSnackbar("Gasto eliminado");
        await this.getEntries(tripId);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },
  },
});
