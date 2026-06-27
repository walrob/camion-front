import type { StatusOption } from "~/composables/useFleetStatus";

export const tripStatusOptions: StatusOption[] = [
  { value: "assigned", label: "Asignado", color: "grey" },
  { value: "in_progress", label: "En curso", color: "primary" },
  { value: "finished", label: "Finalizado", color: "success" },
  { value: "canceled", label: "Cancelado", color: "error" },
];

export interface ExpenseTypeOption extends StatusOption {
  icon: string;
}

export const expenseTypeOptions: ExpenseTypeOption[] = [
  { value: "fuel", label: "Combustible", color: "primary", icon: "mdi-gas-station" },
  { value: "toll", label: "Peaje", color: "info", icon: "mdi-boom-gate" },
  { value: "expense", label: "Gasto", color: "secondary", icon: "mdi-cash" },
  { value: "cash_advance", label: "Adelanto", color: "warning", icon: "mdi-cash-minus" },
  { value: "repair", label: "Reparación", color: "error", icon: "mdi-wrench" },
  { value: "fine", label: "Multa", color: "error", icon: "mdi-alert-octagon" },
  { value: "per_diem", label: "Viático", color: "success", icon: "mdi-food" },
  { value: "other", label: "Otro", color: "grey", icon: "mdi-dots-horizontal" },
];

export const useTripStatus = () => {
  const find = (opts: StatusOption[], v?: string) =>
    opts.find((o) => o.value === v) ?? { value: v ?? "", label: v ?? "-", color: "grey" };

  return {
    tripStatusOptions,
    expenseTypeOptions,
    tripStatus: (v?: string) => find(tripStatusOptions, v),
    expenseType: (v?: string) =>
      (expenseTypeOptions.find((o) => o.value === v) ?? {
        value: v ?? "",
        label: v ?? "-",
        color: "grey",
        icon: "mdi-cash",
      }) as ExpenseTypeOption,
  };
};
