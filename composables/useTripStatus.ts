import type { StatusOption } from "~/composables/useFleetStatus";
import { useCatalogStore, CATALOG, EXPENSE_TYPE_FALLBACK } from "~/stores/catalog";

export const tripStatusOptions: StatusOption[] = [
  { value: "assigned", label: "Asignado", color: "grey" },
  { value: "in_progress", label: "En curso", color: "primary" },
  { value: "finished", label: "Finalizado", color: "success" },
  { value: "canceled", label: "Cancelado", color: "error" },
];

export interface ExpenseTypeOption extends StatusOption {
  icon: string;
}

/**
 * Los tipos que trae el producto. Ya no son *la* lista: la de cada empresa sale
 * de su catálogo (docs/CONFIGURACION.md §5). Se derivan del fallback del store
 * para no tener la misma tabla escrita dos veces.
 */
export const expenseTypeOptions: ExpenseTypeOption[] = EXPENSE_TYPE_FALLBACK.map(
  (i) => ({
    value: i.key,
    label: i.label,
    color: i.color ?? "grey",
    icon: i.icon ?? "mdi-cash",
  }),
);

export const useTripStatus = () => {
  const find = (opts: StatusOption[], v?: string) =>
    opts.find((o) => o.value === v) ?? { value: v ?? "", label: v ?? "-", color: "grey" };

  // Los estados del viaje son la máquina de estados y no se configuran; los
  // tipos de gasto sí: salen del catálogo de la empresa
  // (docs/CONFIGURACION.md §5 y §8).
  const catalogs = useCatalogStore();

  return {
    tripStatusOptions,
    expenseTypeOptions,
    tripStatus: (v?: string) => find(tripStatusOptions, v),
    expenseType: (v?: string) => {
      const delCatalogo = catalogs.todos(CATALOG.EXPENSE_TYPE).find((i) => i.key === v);
      if (delCatalogo) {
        return {
          value: delCatalogo.key,
          label: delCatalogo.label,
          color: delCatalogo.color ?? "grey",
          icon: delCatalogo.icon ?? "mdi-cash",
        } as ExpenseTypeOption;
      }
      return (expenseTypeOptions.find((o) => o.value === v) ?? {
        value: v ?? "",
        label: v ?? "-",
        color: "grey",
        icon: "mdi-cash",
      }) as ExpenseTypeOption;
    },
  };
};
