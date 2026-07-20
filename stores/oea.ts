import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import { lastNDaysRange } from "~/composables/useDateRange";

export interface OeaItem {
  id: string;
  key: string;
  section: string;
  label: string;
  status: string;
  notes?: string;
}

export interface OeaInspection {
  id: string;
  tripId?: string | null;
  truckId: string;
  trailerId?: string | null;
  driverId: string;
  tripNumber?: string | null;
  origin?: string | null;
  destination?: string | null;
  cargoDescription?: string | null;
  cargoWeightKg?: number | null;
  customsSealNumber?: string | null;
  securitySealNumber?: string | null;
  driverDocument?: string | null;
  driverLicense?: string | null;
  result: string;
  signatureKey?: string | null;
  signedAt?: string | null;
  inspectedAt?: string | null;
  notes?: string | null;
  truck?: any;
  driver?: any;
  items: OeaItem[];
}

export const useOeaStore = defineStore("oea", {
  state: () => {
    // Rango precargado: últimos 30 días (from/to siempre se envían al back).
    const { from, to } = lastNDaysRange(30);
    return {
      list: [] as OeaInspection[],
      meta: null as any,
      current: null as OeaInspection | null,
      myList: [] as OeaInspection[],
      loading: false,
      saving: false,
      sortBy: null as string | null,
      sortOrder: null as "asc" | "desc" | null,
      filters: {
        truckId: null as string | null,
        driverId: null as string | null,
        result: null as string | null,
        from: from as string | null,
        to: to as string | null,
      },
    };
  },

  getters: {
    isSigned: (state) => !!state.current?.signedAt,
  },

  actions: {
    cleanParams(extra: Record<string, any> = {}) {
      const p: Record<string, any> = { ...extra };
      Object.entries(this.filters).forEach(([k, v]) => {
        if (v) p[k] = v;
      });
      return p;
    },

    // Orden por columna (server-side): guarda el criterio y recarga la 1ª página.
    // `key` nulo = se quitó el orden (vuelve al default del back).
    setSort(sort: { key: string | null; order: "asc" | "desc" | null }) {
      this.sortBy = sort.key;
      this.sortOrder = sort.order;
      this.getList(1);
    },

    // ───────── Backoffice ─────────
    async getList(page = 1) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        const resp = await $api.get("oea/", {
          params: this.cleanParams({
            page,
            ...(this.sortBy
              ? { sortBy: this.sortBy, order: this.sortOrder }
              : {}),
          }),
        });
        this.list = resp.data.items;
        this.meta = resp.data.meta;
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    async getOne(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        const resp = await $api.get(`oea/${id}/`);
        this.current = resp.data;
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    // ───────── Chofer ─────────
    async getMine() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        const resp = await $api.get("oea/me/");
        this.myList = resp.data;
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    async create(payload: Record<string, any>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      try {
        const resp = await $api.post("oea/", payload);
        this.current = resp.data;
        return resp.data as OeaInspection;
      } catch (e) {
        general.setErrorSnackbar(e);
        return null;
      } finally {
        this.saving = false;
      }
    },

    async updateHeader(id: string, payload: Record<string, any>) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.patch(`oea/${id}/`, payload);
        if (this.current) Object.assign(this.current, resp.data);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async updateItem(
      itemId: string,
      payload: { status?: string; notes?: string },
      file?: File | null,
    ) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        await $api.patch(`oea/items/${itemId}/`, payload);
        if (file) await this.uploadAttachment("oea_item", itemId, file);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async sign(id: string, signatureBlob: Blob, result?: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      try {
        const file = new File([signatureBlob], "firma.png", {
          type: "image/png",
        });
        const att = await this.uploadAttachment("oea_signature", id, file);
        await $api.post(`oea/${id}/sign/`, {
          signatureKey: att.s3Key,
          ...(result ? { result } : {}),
        });
        general.setSuccessSnackbar("Planilla OEA firmada");
        await this.getOne(id);
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
