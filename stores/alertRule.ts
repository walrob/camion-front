import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export interface AlertRule {
  key: string;
  label: string;
  help: string;
  level: "red" | "orange" | "yellow" | "green";
  threshold?: {
    default: string;
    label: string;
    unit: string;
    min: number;
    max: number;
  };
  /** Reglas que no se apagan: son el corazón del producto. */
  siempreActiva?: boolean;
  enabled: boolean;
  value: string | null;
  /** La empresa la configuró: es lo que consume cupo del plan. */
  personalizada: boolean;
}

/**
 * Reglas del motor de alertas (docs/CONFIGURACION.md §6.3).
 *
 * Una empresa que no entra acá recibe exactamente las mismas alertas que antes:
 * todas activas con los valores de fábrica.
 */
export const useAlertRuleStore = defineStore("alertRule", {
  state: () => ({
    rules: [] as AlertRule[],
    loading: false,
    saving: false,
  }),

  actions: {
    async getRules() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("alerts/rules/")
        .then((resp) => (this.rules = resp.data))
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async save(rules: { key: string; enabled?: boolean; value?: string }[]) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      return await $api
        .put("alerts/rules/", { rules })
        .then((resp) => {
          this.rules = resp.data;
          general.setSuccessSnackbar("Reglas de alerta guardadas.");
          return true;
        })
        .catch((e) => {
          general.setErrorSnackbar(e);
          return false;
        })
        .finally(() => (this.saving = false));
    },
  },
});
