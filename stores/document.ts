import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export const useDocumentStore = defineStore("document", {
  state: () => ({
    documents: [] as any[],
    expiring: [] as any[],
    myDocuments: [] as any[],
    ownerOptions: [] as { id: string; label: string }[],
    loading: false,
    error: false,
    ownerType: "truck" as string,
    ownerId: null as string | null,
    category: null as string | null,
  }),

  actions: {
    async getDocuments() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      if (this.ownerType !== "company" && !this.ownerId) {
        this.documents = [];
        return;
      }
      this.loading = true;
      this.error = false;
      return await $api
        .get("documents/", {
          params: {
            ownerType: this.ownerType,
            ownerId: this.ownerType === "company" ? undefined : this.ownerId,
            category: this.category || undefined,
          },
        })
        .then((resp) => (this.documents = resp.data))
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    async getExpiring() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get("documents/expiring/", { params: { days: 30 } })
        .then((resp) => (this.expiring = resp.data))
        .catch((e) => general.setErrorSnackbar(e));
    },

    // Descarga a Excel los documentos por vencer / vencidos.
    async exportExpiringXlsx() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.get("documents/expiring/export/", {
          params: { days: 30 },
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([resp.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "vencimientos.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        general.setErrorSnackbar(e);
      }
    },

    async getMine(truckId?: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("documents/me/", { params: { truckId: truckId || undefined } })
        .then((resp) => (this.myDocuments = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async loadOwnerOptions(ownerType: string) {
      const { $api } = useNuxtApp();
      if (ownerType === "company") {
        this.ownerOptions = [];
        return;
      }
      const endpoint =
        ownerType === "truck" ? "trucks/" : ownerType === "trailer" ? "trailers/" : "drivers/";
      const resp = await $api.get(endpoint, { params: { limit: 100 } });
      this.ownerOptions = (resp.data.items || []).map((o: any) => ({
        id: o.id,
        label:
          ownerType === "driver"
            ? o.user?.name || o.licenseNumber || o.id
            : o.plate,
      }));
    },

    async createDocument(form: FormData, throwOnError = false) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        await $api.post("documents/", form);
        general.setSuccessSnackbar("Documento guardado");
        await this.getDocuments();
        await this.getExpiring();
        return true;
      } catch (e) {
        if (throwOnError) throw e;
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async deleteDocument(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        await $api.delete(`documents/${id}/`);
        general.setSuccessSnackbar("Documento eliminado");
        await this.getDocuments();
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async openFile(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        const resp = await $api.get(`documents/${id}/file/`);
        if (resp.data?.url) window.open(resp.data.url, "_blank");
        else general.setSnackbar({ color: "warning", message: "Sin archivo adjunto." });
      } catch (e) {
        general.setErrorSnackbar(e);
      }
    },
  },
});
