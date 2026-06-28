import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export interface ChecklistItem {
  id: string;
  key: string;
  label: string;
  status: string;
  notes?: string;
}
export interface Checklist {
  id: string;
  tripId: string;
  truckId: string;
  driverId: string;
  result: string;
  signatureKey?: string | null;
  signedAt?: string | null;
  items: ChecklistItem[];
}

export const useChecklistStore = defineStore("checklist", {
  state: () => ({
    checklist: null as Checklist | null,
    loading: false,
    saving: false,
  }),

  getters: {
    isApproved: (state) => state.checklist?.result === "approved",
  },

  actions: {
    async load(tripId: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        const resp = await $api.get(`checklists/trip/${tripId}/`);
        this.checklist = resp.data;
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    /** Crea el checklist del viaje si aún no existe. */
    async ensure(payload: { tripId: string; truckId: string; driverId: string }) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        if (!this.checklist) {
          const resp = await $api.post("checklists/", payload);
          this.checklist = resp.data;
        }
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    async updateItem(itemId: string, payload: { status?: string; notes?: string }, file?: File | null) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        await $api.patch(`checklists/items/${itemId}/`, payload);
        if (file) await this.uploadAttachment("checklist_item", itemId, file);
        if (this.checklist) await this.load(this.checklist.tripId);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async sign(signatureBlob: Blob) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      if (!this.checklist) return false;
      this.saving = true;
      try {
        const file = new File([signatureBlob], "firma.png", { type: "image/png" });
        const att = await this.uploadAttachment("checklist_signature", this.checklist.id, file);
        await $api.post(`checklists/${this.checklist.id}/sign/`, {
          signatureKey: att.s3Key,
        });
        general.setSuccessSnackbar("Checklist firmado y aprobado");
        await this.load(this.checklist.tripId);
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
