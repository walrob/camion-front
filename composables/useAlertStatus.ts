import type { StatusOption } from "~/composables/useFleetStatus";

export const alertLevelOptions: StatusOption[] = [
  { value: "red", label: "🔴 Crítica", color: "error" },
  { value: "orange", label: "🟠 Alta", color: "warning" },
  { value: "yellow", label: "🟡 Media", color: "amber" },
  { value: "green", label: "🟢 Aviso", color: "success" },
];

export const alertStatusOptions: StatusOption[] = [
  { value: "new", label: "Nueva", color: "error" },
  { value: "seen", label: "Vista", color: "info" },
  { value: "acknowledged", label: "Atendida", color: "warning" },
  { value: "resolved", label: "Resuelta", color: "success" },
];

export const ALERT_LEVEL_PRIORITY: Record<string, number> = {
  red: 0,
  orange: 1,
  yellow: 2,
  green: 3,
};

export const useAlertStatus = () => {
  const find = (opts: StatusOption[], v?: string) =>
    opts.find((o) => o.value === v) ?? { value: v ?? "", label: v ?? "-", color: "grey" };
  return {
    alertLevelOptions,
    alertStatusOptions,
    alertLevel: (v?: string) => find(alertLevelOptions, v),
    alertStatus: (v?: string) => find(alertStatusOptions, v),
  };
};
