import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export type OnboardingStepKey =
  | "trucks"
  | "drivers"
  | "driverApp"
  | "expirations"
  | "trip"
  | "tripFinished"
  | "logo";

export interface OnboardingStep {
  key: OnboardingStepKey;
  done: boolean;
  /** No cuenta para el progreso ni para dar la guía por terminada. */
  optional?: boolean;
}

/**
 * Primeros pasos de una empresa nueva. El progreso lo calcula el back sobre los
 * datos reales (camiones, choferes, vencimientos, viajes): acá no se marca nada
 * a mano.
 */
export const useOnboardingStore = defineStore("onboarding", {
  state: () => ({
    steps: [] as OnboardingStep[],
    hidden: true,
    loaded: false,
    loading: false,
  }),

  getters: {
    required: (state) => state.steps.filter((s) => !s.optional),
    completed(): number {
      return this.required.filter((s) => s.done).length;
    },
    allDone(): boolean {
      return this.required.length > 0 && this.required.every((s) => s.done);
    },
  },

  actions: {
    async getProgress() {
      const { $api } = useNuxtApp();
      this.loading = true;
      return await $api
        .get("onboarding/")
        .then((resp) => {
          this.steps = resp.data.steps ?? [];
          this.hidden = !!resp.data.hidden;
          this.loaded = true;
        })
        .catch(() => {
          // Es una guía: si no se puede consultar, no se muestra.
          this.hidden = true;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    async hide() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.hidden = true;
      return await $api
        .post("onboarding/hide")
        .catch((e) => general.setErrorSnackbar(e));
    },
  },
});
