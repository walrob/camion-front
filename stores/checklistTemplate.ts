import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export interface ChecklistTemplateItem {
  id?: string;
  key: string;
  label: string;
  order: number;
  isCritical: boolean;
  requiresPhotoOnFail: boolean;
  isActive: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  /** `null` = plantilla general, aplica a toda unidad sin plantilla propia. */
  vehicleType: string | null;
  isActive: boolean;
  items: ChecklistTemplateItem[];
}

/**
 * Plantillas del checklist pre-viaje (docs/CONFIGURACION.md §6.1).
 *
 * Mientras la empresa no cree ninguna, el sistema usa los ítems por defecto;
 * `getDefaults()` los trae para precargar la primera, que es lo que evita que
 * configurarla arranque con una hoja en blanco.
 */
export const useChecklistTemplateStore = defineStore("checklistTemplate", {
  state: () => ({
    templates: [] as ChecklistTemplate[],
    defaults: [] as ChecklistTemplateItem[],
    loading: false,
    saving: false,
    error: false,
  }),

  actions: {
    async getTemplates() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      this.error = false;
      return await $api
        .get("checklist-templates/")
        .then((resp) => (this.templates = resp.data))
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    async getDefaults() {
      if (this.defaults.length) return;
      const { $api } = useNuxtApp();
      return await $api
        .get("checklist-templates/defaults/")
        .then((resp) => (this.defaults = resp.data))
        .catch(() => (this.defaults = []));
    },

    async save(payload: Partial<ChecklistTemplate>, id?: string): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      const req = id
        ? $api.patch(`checklist-templates/${id}/`, payload)
        : $api.post("checklist-templates/", payload);
      return await req
        .then(async () => {
          general.setSuccessSnackbar("Plantilla guardada.");
          await this.getTemplates();
          return true;
        })
        .catch((e) => {
          general.setErrorSnackbar(e);
          return false;
        })
        .finally(() => (this.saving = false));
    },

    async remove(id: string): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .delete(`checklist-templates/${id}/`)
        .then(async () => {
          general.setSuccessSnackbar("Plantilla eliminada.");
          await this.getTemplates();
          return true;
        })
        .catch((e) => {
          general.setErrorSnackbar(e);
          return false;
        });
    },
  },
});
