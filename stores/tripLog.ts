import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import { useOfflineQueue, fileToDataUrl } from "~/composables/useOfflineQueue";
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

    /**
     * Crea una entrada y, si hay foto, la sube al módulo attachments.
     * Offline-first: si no hay conexión (o falla la red), se encola con un
     * clientId idempotente y se sincroniza al recuperar señal.
     */
    async createEntry(payload: Partial<TripLogEntry>, file?: File | null) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      const queue = useOfflineQueue();
      const clientId =
        (globalThis.crypto?.randomUUID?.() as string) ||
        `${Date.now()}-${Math.random()}`;

      const enqueue = async () => {
        const photoDataUrl = file ? await fileToDataUrl(file) : undefined;
        queue.enqueue({ clientId, payload: { ...payload, clientId }, photoDataUrl });
        general.setSnackbar({
          color: "warning",
          message: "Sin conexión: guardado y se sincronizará luego.",
        });
        return true;
      };

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return enqueue();
      }

      try {
        const resp = await $api.post("trip-log/", { ...payload, clientId });
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
      } catch (e: any) {
        // Error de red => encolar; otros errores => mostrar.
        if (!e?.response) return enqueue();
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
