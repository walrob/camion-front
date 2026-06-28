import type { StatusOption } from "~/composables/useFleetStatus";

export const triggerTypeOptions: StatusOption[] = [
  { value: "km", label: "Kilómetros", color: "primary" },
  { value: "hours", label: "Horas de uso", color: "info" },
  { value: "date", label: "Fecha", color: "secondary" },
];

export const planStatusOptions: StatusOption[] = [
  { value: "active", label: "Activo", color: "success" },
  { value: "paused", label: "Pausado", color: "grey" },
];

export const orderStatusOptions: StatusOption[] = [
  { value: "open", label: "Abierta", color: "warning" },
  { value: "in_progress", label: "En proceso", color: "info" },
  { value: "done", label: "Finalizada", color: "success" },
];

export const useMaintenanceStatus = () => {
  const find = (opts: StatusOption[], v?: string) =>
    opts.find((o) => o.value === v) ?? { value: v ?? "", label: v ?? "-", color: "grey" };
  return {
    triggerTypeOptions,
    planStatusOptions,
    orderStatusOptions,
    triggerType: (v?: string) => find(triggerTypeOptions, v),
    planStatus: (v?: string) => find(planStatusOptions, v),
    orderStatus: (v?: string) => find(orderStatusOptions, v),
  };
};
