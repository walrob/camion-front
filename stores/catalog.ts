import { computed } from "vue";
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

/**
 * Algunos catálogos no son sólo etiquetas: el código hace algo distinto según
 * el elemento (un gasto que resta, un puesto que define el rol de acceso). El
 * backend declara acá el conjunto cerrado de valores posibles y la pantalla
 * dibuja el selector con eso, sin conocer ningún catálogo en particular.
 */
export interface CatalogBehaviorDef {
  label: string;
  help: string;
  porDefecto: string;
  opciones: { value: string; label: string }[];
}

export interface CatalogDef {
  key: string;
  label: string;
  help: string;
  comportamiento: CatalogBehaviorDef | null;
}

export const CATALOG = {
  EXPENSE_TYPE: "expense_type",
  INCIDENT_TYPE: "incident_type",
  DOCUMENT_CATEGORY: "document_category",
  CERTIFICATION_TYPE: "certification_type",
  EMPLOYEE_POSITION: "employee_position",
  LEAVE_TYPE: "leave_type",
  FUEL_TYPE: "fuel_type",
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

export const DOCUMENT_CATEGORY_FALLBACK = [
  { key: "insurance", label: "Seguro", color: "primary" },
  { key: "vtv", label: "VTV", color: "info" },
  { key: "license", label: "Licencia", color: "secondary" },
  { key: "id_card", label: "Carnet / DNI", color: "secondary" },
  { key: "permit", label: "Habilitación", color: "warning" },
  { key: "delivery_note", label: "Remito", color: "grey" },
  { key: "waybill", label: "Carta de porte", color: "grey" },
  { key: "other", label: "Otro", color: "grey" },
];

export const CERTIFICATION_TYPE_FALLBACK = [
  { key: "driving_license", label: "Carnet de conducir", color: "primary" },
  { key: "professional_license", label: "Licencia profesional (LiNTI)", color: "primary" },
  { key: "dangerous_goods", label: "Carga peligrosa", color: "error" },
  { key: "medical_exam", label: "Psicofísico", color: "info" },
  { key: "hazmat", label: "HazMat", color: "error" },
  { key: "crane_operator", label: "Operador de grúa", color: "secondary" },
  { key: "defensive_driving", label: "Manejo defensivo", color: "info" },
  { key: "first_aid", label: "Primeros auxilios", color: "info" },
  { key: "other", label: "Otro", color: "grey" },
];

/** El `behavior` de un puesto es el rol con el que entra la persona a la app. */
export const EMPLOYEE_POSITION_FALLBACK = [
  { key: "driver", label: "Chofer", color: "primary", behavior: "driver" },
  { key: "mechanic", label: "Mecánico", color: "info", behavior: "maintenance" },
  { key: "dispatcher", label: "Despachante", color: "secondary", behavior: "dispatcher" },
  { key: "manager", label: "Gerente", color: "warning", behavior: "manager" },
  { key: "admin", label: "Administrativo", color: "grey", behavior: "admin" },
  { key: "other", label: "Otro", color: "grey", behavior: "driver" },
];

export const LEAVE_TYPE_FALLBACK = [
  { key: "vacation", label: "Vacaciones", color: "info" },
  { key: "sick", label: "Enfermedad", color: "warning" },
  { key: "work_accident", label: "Accidente laboral", color: "error" },
  { key: "parental", label: "Licencia parental", color: "secondary" },
  { key: "unpaid", label: "Sin goce de sueldo", color: "grey" },
  { key: "study", label: "Estudio", color: "info" },
  { key: "bereavement", label: "Fallecimiento familiar", color: "grey" },
  { key: "other", label: "Otra", color: "grey" },
];

export const FUEL_TYPE_FALLBACK = [
  { key: "diesel", label: "Diésel", color: "primary", icon: "mdi-gas-station" },
  { key: "gasoline", label: "Nafta", color: "info", icon: "mdi-fuel" },
  { key: "gnc", label: "GNC", color: "success", icon: "mdi-gas-cylinder" },
  { key: "adblue", label: "AdBlue", color: "secondary", icon: "mdi-water" },
];

const comoItems = (
  base: { key: string; label: string; color?: string; icon?: string; behavior?: string }[],
): CatalogItem[] =>
  base.map((o, i) => ({ ...o, order: i, isActive: true, isSystem: true }));

const porDefecto = (): Record<string, CatalogItem[]> => ({
  [CATALOG.EXPENSE_TYPE]: comoItems(EXPENSE_TYPE_FALLBACK),
  [CATALOG.INCIDENT_TYPE]: comoItems(INCIDENT_TYPE_FALLBACK),
  [CATALOG.DOCUMENT_CATEGORY]: comoItems(DOCUMENT_CATEGORY_FALLBACK),
  [CATALOG.CERTIFICATION_TYPE]: comoItems(CERTIFICATION_TYPE_FALLBACK),
  [CATALOG.EMPLOYEE_POSITION]: comoItems(EMPLOYEE_POSITION_FALLBACK),
  [CATALOG.LEAVE_TYPE]: comoItems(LEAVE_TYPE_FALLBACK),
  [CATALOG.FUEL_TYPE]: comoItems(FUEL_TYPE_FALLBACK),
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

/**
 * Opciones activas de un catálogo, en el formato `{ value, label }` que usan
 * los selectores de la app.
 *
 * Dispara la carga por su cuenta —es idempotente y queda cacheada—, así cada
 * pantalla que necesita una lista no tiene que acordarse de pedirla.
 */
export const useCatalogOptions = (catalog: string) => {
  const store = useCatalogStore();
  store.load();
  return computed(() =>
    store.activos(catalog).map((i) => ({
      value: i.key,
      label: i.label,
      color: i.color ?? "grey",
      icon: i.icon,
    })),
  );
};
