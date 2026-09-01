import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

export interface CatalogItem {
  key: string;
  label: string;
  color?: string;
  icon?: string;
  order: number;
  behavior?: string;
  isActive: boolean;
  /** Los que trae el sistema: se renombran y desactivan, no se eliminan. */
  isSystem: boolean;
}

export interface CatalogDef {
  key: string;
  label: string;
  help: string;
  usaComportamiento: boolean;
}

export const CATALOG = {
  EXPENSE_TYPE: "expense_type",
  INCIDENT_TYPE: "incident_type",
} as const;

/** Un tipo de gasto con este comportamiento **resta** en la rendición. */
export const BEHAVIOR_ADVANCE = "advance";

const KEY_CACHE = "fleetlog_catalogs";

/**
 * Los elementos que trae el producto, espejo de `catalogs.catalog.ts` del
 * backend. Son el **último recurso**: la app del chofer trabaja sin señal, y si
 * no hay respuesta del servidor ni caché, un selector vacío es peor que una
 * lista genérica (docs/CONFIGURACION.md §11).
 *
 * Viven acá y no en los composables para que la dependencia vaya en un solo
 * sentido —composables → store—: al revés queda un import circular, que en el
 * build de producción se resuelve como `undefined` cuando menos se espera.
 */
export const EXPENSE_TYPE_FALLBACK = [
  { key: "fuel", label: "Combustible", color: "primary", icon: "mdi-gas-station" },
  { key: "toll", label: "Peaje", color: "info", icon: "mdi-boom-gate" },
  { key: "expense", label: "Gasto", color: "secondary", icon: "mdi-cash" },
  {
    key: "cash_advance",
    label: "Adelanto",
    color: "warning",
    icon: "mdi-cash-minus",
    behavior: BEHAVIOR_ADVANCE,
  },
  { key: "repair", label: "Reparación", color: "error", icon: "mdi-wrench" },
  { key: "fine", label: "Multa", color: "error", icon: "mdi-alert-octagon" },
  { key: "per_diem", label: "Viático", color: "success", icon: "mdi-food" },
  { key: "other", label: "Otro", color: "grey", icon: "mdi-dots-horizontal" },
];

export const INCIDENT_TYPE_FALLBACK = [
  { key: "mechanical", label: "Rotura mecánica", color: "warning", icon: "mdi-wrench" },
  { key: "accident", label: "Accidente", color: "error", icon: "mdi-car-emergency" },
  { key: "cash_shortage", label: "Falta de dinero", color: "info", icon: "mdi-cash-remove" },
  { key: "delay", label: "Retraso", color: "secondary", icon: "mdi-clock-alert" },
  {
    key: "cargo_issue",
    label: "Problema con carga",
    color: "warning",
    icon: "mdi-package-variant-closed-remove",
  },
  {
    key: "client_issue",
    label: "Problema con cliente",
    color: "info",
    icon: "mdi-account-alert",
  },
  { key: "emergency", label: "Emergencia", color: "error", icon: "mdi-alarm-light" },
];

const comoItems = (
  base: { key: string; label: string; color?: string; icon?: string; behavior?: string }[],
): CatalogItem[] =>
  base.map((o, i) => ({ ...o, order: i, isActive: true, isSystem: true }));

const porDefecto = (): Record<string, CatalogItem[]> => ({
  [CATALOG.EXPENSE_TYPE]: comoItems(EXPENSE_TYPE_FALLBACK),
  [CATALOG.INCIDENT_TYPE]: comoItems(INCIDENT_TYPE_FALLBACK),
});

const leerCache = (): Record<string, CatalogItem[]> | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    const crudo = localStorage.getItem(KEY_CACHE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

/**
 * Catálogos de negocio de la empresa (tipos de gasto, de incidente…).
 *
 * Orden de resolución: servidor → caché del dispositivo → constante del código.
 * La pantalla nunca espera al servidor: pinta con lo que tiene y se refresca.
 */
export const useCatalogStore = defineStore("catalog", {
  state: () => ({
    catalogs: [] as CatalogDef[],
    items: (leerCache() ?? porDefecto()) as Record<string, CatalogItem[]>,
    loading: false,
    saving: false,
    cargado: false,
  }),

  getters: {
    /** Elementos activos de un catálogo: lo que se ofrece al cargar algo nuevo. */
    activos: (state) => (catalog: string) =>
      (state.items[catalog] ?? []).filter((i) => i.isActive),

    /** Todos, incluidos los desactivados: el histórico los sigue nombrando. */
    todos: (state) => (catalog: string) => state.items[catalog] ?? [],

    /** Resuelve un elemento por su clave, con un fallback legible. */
    resolver:
      (state) =>
      (catalog: string, key?: string): CatalogItem => {
        const item = (state.items[catalog] ?? []).find((i) => i.key === key);
        return (
          item ?? {
            key: key ?? "",
            label: key ?? "-",
            color: "grey",
            order: 999,
            isActive: false,
            isSystem: false,
          }
        );
      },
  },

  actions: {
    async load(forzar = false) {
      if (this.cargado && !forzar) return;
      const { $api } = useNuxtApp();
      this.loading = true;
      return await $api
        .get("catalogs/")
        .then((resp) => {
          this.catalogs = resp.data.catalogs;
          this.items = resp.data.items;
          this.cargado = true;
          try {
            localStorage.setItem(KEY_CACHE, JSON.stringify(this.items));
          } catch {
            // Sin espacio o en modo privado: se sigue con lo que hay en memoria.
          }
        })
        .catch(() => {
          // Sin red se opera con la caché o las constantes: no se molesta al
          // chofer con un error por algo que no le impide trabajar.
        })
        .finally(() => (this.loading = false));
    },

    async save(catalog: string, items: Partial<CatalogItem>[]): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      return await $api
        .put(`catalogs/${catalog}/`, { items })
        .then((resp) => {
          this.items = { ...this.items, [catalog]: resp.data };
          general.setSuccessSnackbar("Catálogo guardado.");
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
