import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { ChecklistAnswer, ChecklistItemType } from "@/stores/checklist";

export interface ChecklistTemplateItem {
  id?: string;
  key: string;
  label: string;
  /** Bloque de la planilla. `null` = lista corrida, como venían todas. */
  section?: string | null;
  /** Advertencia o instrucción que se muestra junto al punto. */
  helpText?: string | null;
  type?: ChecklistItemType;
  /** La respuesta que indica que está todo bien: «¿tiene pérdidas?» espera NO. */
  expectedAnswer?: ChecklistAnswer;
  order: number;
  isCritical: boolean;
  requiresPhotoOnFail: boolean;
  /** Foto obligatoria siempre, salga como salga el punto. */
  requiresPhoto?: boolean;
  minPhotos?: number;
  maxPhotos?: number | null;
  /** En falla, la planilla queda esperando a Tráfico en vez de resolverse sola. */
  requiresValidationOnFail?: boolean;
  isActive: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  /**
   * Identidad del formulario en el sistema documental de la empresa:
   * «RIP 06 09 01», «REV.04» y su fecha. Quien opera bajo OEA no pide «el
   * checklist», pide el formulario por su código y revisión.
   */
  code?: string | null;
  revision?: string | null;
  revisionDate?: string | null;
  /** `null` = plantilla general, aplica a toda unidad sin plantilla propia. */
  vehicleType: string | null;
  isActive: boolean;
  items: ChecklistTemplateItem[];
}

/** Los tipos de punto, para dibujar el selector del editor. */
export const TIPOS_DE_PUNTO: {
  value: ChecklistItemType;
  label: string;
  help: string;
  icon: string;
}[] = [
  {
    value: "condition",
    label: "Pregunta",
    help: "Se contesta sí/no y se evalúa contra la respuesta esperada.",
    icon: "mdi-help-circle-outline",
  },
  {
    value: "ack",
    label: "Declaración",
    help: "El chofer la acepta. Sin aceptarla no puede firmar.",
    icon: "mdi-gavel",
  },
  {
    value: "photo",
    label: "Fotos",
    help: "Sólo adjuntos: por ejemplo, el interior del furgón.",
    icon: "mdi-camera",
  },
  {
    value: "text",
    label: "Texto libre",
    help: "Un campo para que escriba lo que considere importante.",
    icon: "mdi-text-box-outline",
  },
];

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
