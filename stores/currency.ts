import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export interface Currency {
  code: string;
  symbol: string;
  decimals: number;
  isBase: boolean;
}

export interface ExchangeRate {
  id: string;
  code: string;
  date: string;
  rate: number;
  source: string;
}

const KEY_CACHE = "fleetlog_currencies";

/** Con una sola moneda el sistema se comporta como siempre: sin selectores. */
const PESO: Currency = { code: "ARS", symbol: "$", decimals: 2, isBase: true };

const leerCache = (): Currency[] | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    const crudo = localStorage.getItem(KEY_CACHE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

/**
 * Monedas de la empresa y sus cotizaciones (docs/CONFIGURACION.md §7).
 *
 * Se cachea igual que los catálogos: el chofer tiene que poder elegir la moneda
 * de un peaje en la frontera aunque esté sin señal.
 */
export const useCurrencyStore = defineStore("currency", {
  state: () => ({
    base: "ARS",
    currencies: (leerCache() ?? [PESO]) as Currency[],
    conocidas: [] as { code: string; symbol: string; decimals: number; label: string }[],
    rates: [] as ExchangeRate[],
    loading: false,
    saving: false,
    cargado: false,
  }),

  getters: {
    /** ¿Hay que mostrar selector de moneda? Con una sola, no. */
    esMultimoneda: (state) => state.currencies.length > 1,

    /** Cómo se muestra un importe de esta moneda. */
    porCodigo: (state) => (code?: string) =>
      state.currencies.find((c) => c.code === code) ?? {
        code: code ?? state.base,
        symbol: code ?? "",
        decimals: 2,
        isBase: code === state.base,
      },
  },

  actions: {
    async load(forzar = false) {
      if (this.cargado && !forzar) return;
      const { $api } = useNuxtApp();
      this.loading = true;
      return await $api
        .get("currencies/")
        .then((resp) => {
          this.base = resp.data.base;
          this.currencies = resp.data.currencies;
          this.conocidas = resp.data.conocidas;
          this.cargado = true;
          try {
            localStorage.setItem(KEY_CACHE, JSON.stringify(this.currencies));
          } catch {
            // Sin espacio o en modo privado: se sigue con lo que hay en memoria.
          }
        })
        .catch(() => {
          // Sin red se opera con la caché: no es un error que le importe al chofer.
        })
        .finally(() => (this.loading = false));
    },

    async getRates(code?: string) {
      const { $api } = useNuxtApp();
      return await $api
        .get("currencies/rates/", { params: { code } })
        .then((resp) => (this.rates = resp.data))
        .catch(() => (this.rates = []));
    },

    async saveCurrencies(currencies: Partial<Currency>[]): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      return await $api
        .put("currencies/", { currencies })
        .then((resp) => {
          this.currencies = resp.data;
          general.setSuccessSnackbar("Monedas guardadas.");
          return true;
        })
        .catch((e) => {
          general.setErrorSnackbar(e);
          return false;
        })
        .finally(() => (this.saving = false));
    },

    /**
     * Carga la cotización de un día. El backend, además de guardarla, completa
     * los movimientos que habían quedado pendientes de conversión.
     */
    async saveRate(payload: {
      code: string;
      date: string;
      rate: number;
    }): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      return await $api
        .post("currencies/rates/", payload)
        .then(async () => {
          general.setSuccessSnackbar(
            "Cotización cargada. Los movimientos pendientes ya quedaron convertidos.",
          );
          await this.getRates();
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
