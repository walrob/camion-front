import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export type SettingType = "boolean" | "number" | "string" | "enum";

export interface SettingDef {
  key: string;
  group: string;
  type: SettingType;
  default: string;
  label: string;
  help: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  maxLength?: number;
  /** Valor efectivo de la empresa (default del código si nunca se tocó). */
  value: string;
  isDefault: boolean;
}

export interface SettingGroup {
  key: string;
  label: string;
  help: string;
}

/**
 * Ajustes de operación de la empresa.
 *
 * El backend manda **la definición** de cada ajuste junto con su valor, así que
 * la pantalla de configuración se dibuja sola: agregar un ajuste nuevo es una
 * entrada en el catálogo del back, sin tocar el front (docs/CONFIGURACION.md).
 *
 * También lo consumen las pantallas que cambian de comportamiento según la
 * configuración —la app del chofer, sin ir más lejos—, por eso `load()` no
 * vuelve a pedir si ya están cargados.
 */
export const useSettingsStore = defineStore("settings", {
  state: () => ({
    groups: [] as SettingGroup[],
    settings: [] as SettingDef[],
    loading: false,
    saving: false,
    error: false,
    cargado: false,
  }),

  getters: {
    /** Valor efectivo de un ajuste, ya tipado. */
    bool: (state) => (key: string) =>
      state.settings.find((s) => s.key === key)?.value === "true",
    /**
     * Igual que `bool`, pero con un default explícito para cuando el ajuste
     * todavía no cargó.
     *
     * `bool()` supone `false` ante la ausencia, que es el default de casi
     * todos. Los que valen `true` por defecto tienen que decirlo acá: si no,
     * en la app del chofer —que arranca sin señal— se apagan solos, y una
     * función que la empresa habilitó desaparece de la pantalla.
     */
    boolCon: (state) => (key: string, porDefecto: boolean) => {
      const def = state.settings.find((s) => s.key === key);
      return def ? def.value === "true" : porDefecto;
    },
    num: (state) => (key: string) =>
      Number(state.settings.find((s) => s.key === key)?.value ?? 0),
    str: (state) => (key: string) =>
      state.settings.find((s) => s.key === key)?.value ?? "",
    porGrupo: (state) => (grupo: string) =>
      state.settings.filter((s) => s.group === grupo),
  },

  actions: {
    async load(forzar = false) {
      if (this.cargado && !forzar) return;
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      this.error = false;
      return await $api
        .get("settings/")
        .then((resp) => {
          this.groups = resp.data.groups;
          this.settings = resp.data.settings;
          this.cargado = true;
        })
        .catch((e) => {
          this.error = true;
          general.setErrorSnackbar(e);
        })
        .finally(() => (this.loading = false));
    },

    /**
     * Guarda sólo lo que cambió. El backend ignora lo que ya vale igual, pero
     * mandar el set completo haría que cada «Guardar» pareciera un cambio en la
     * auditoría.
     */
    async save(values: Record<string, string>): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      return await $api
        .patch("settings/", { values })
        .then((resp) => {
          this.groups = resp.data.groups;
          this.settings = resp.data.settings;
          general.setSuccessSnackbar("Configuración guardada.");
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
