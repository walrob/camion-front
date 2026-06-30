import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Incident } from "~/types/incident";

export const useIncidentStore = defineStore("incident", {
  state: () => ({
    myIncidents: [] as Incident[],
    incidents: [] as Incident[],
    incident: null as Incident | null,
    attachments: [] as any[],
    staffUsers: [] as { id: string; name: string }[],
    loading: false,
    error: false,
    filterType: null as string | null,
    filterSeverity: null as string | null,
    filterFrom: null as string | null,
    filterTo: null as string | null,
  }),

  actions: {
    // ───────── Chofer ─────────
    async getMyIncidents() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("incidents/me/")
        .then((resp) => (this.myIncidents = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async createIncident(payload: Record<string, any>, files: File[] = []) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.post("incidents/", payload);
        const incident = resp.data;
        for (const file of files) {
          const form = new FormData();
          form.append("file", file);
          form.append("entityType", "incident");
          form.append("entityId", incident.id);
          await $api.post("attachments/upload/", form);
        }
        general.setSuccessSnackbar("Incidente reportado");
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    // ───────── Backoffice ─────────
    async getIncidents() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      this.error = false;
      return await $api
        .get("incidents/", {
          params: {
            limit: 100,
            type: this.filterType || undefined,
            severity: this.filterSeverity || undefined,
            from: this.filterFrom || undefined,
            to: this.filterTo || undefined,
          },
        })
        .then((resp) => (this.incidents = resp.data.items))
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    async getIncident(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.get(`incidents/${id}/`);
        this.incident = resp.data;
        await this.loadAttachments(id);
      } catch (e) {
        general.setErrorSnackbar(e);
      }
    },

    async loadAttachments(entityId: string) {
      const { $api } = useNuxtApp();
      try {
        const resp = await $api.get("attachments/", {
          params: { entityType: "incident", entityId },
        });
        const list = resp.data;
        for (const a of list) {
          const url = await $api.get(`attachments/${a.id}/url/`);
          a.url = url.data.url;
        }
        this.attachments = list;
      } catch {
        this.attachments = [];
      }
    },

    async loadStaffUsers() {
      const { $api } = useNuxtApp();
      try {
        const resp = await $api.get("users/", { params: { limit: 100 } });
        this.staffUsers = (resp.data.items || []).map((u: any) => ({
          id: u.id,
          name: u.name,
        }));
      } catch {
        this.staffUsers = [];
      }
    },

    async assign(id: string, assignedToUserId: string) {
      return this.mutate(`incidents/${id}/assign/`, "patch", { assignedToUserId }, "Responsable asignado");
    },

    async changeStatus(id: string, status: string, note?: string) {
      return this.mutate(`incidents/${id}/status/`, "patch", { status, note }, "Estado actualizado");
    },

    async comment(id: string, note: string) {
      return this.mutate(`incidents/${id}/comment/`, "post", { note }, "Comentario agregado");
    },

    async mutate(url: string, method: "patch" | "post", payload: any, msg: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await ($api as any)[method](url, payload);
        general.setSuccessSnackbar(msg);
        this.incident = resp.data;
        this.upsert(resp.data);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    /** Inserta o actualiza un incidente en el tablero (usado por WebSocket). */
    upsert(incident: Incident) {
      const idx = this.incidents.findIndex((i) => i.id === incident.id);
      if (idx >= 0) this.incidents[idx] = incident;
      else this.incidents.unshift(incident);
    },
  },
});
