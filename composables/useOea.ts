import type { StatusOption } from "~/composables/useFleetStatus";

export const oeaResultOptions: StatusOption[] = [
  { value: "pending", label: "Pendiente", color: "grey" },
  { value: "conforme", label: "Conforme", color: "success" },
  { value: "no_conforme", label: "No conforme", color: "error" },
];

export const oeaItemStatusOptions: StatusOption[] = [
  { value: "ok", label: "OK", color: "success" },
  { value: "observed", label: "Observado", color: "warning" },
  { value: "na", label: "N/A", color: "grey" },
];

export const oeaSectionLabels: Record<string, string> = {
  physical: "Inspección física (7 puntos)",
  security_devices: "Dispositivos de seguridad",
};

export const useOea = () => {
  const find = (opts: StatusOption[], v?: string) =>
    opts.find((o) => o.value === v) ?? {
      value: v ?? "",
      label: v ?? "-",
      color: "grey",
    };

  return {
    oeaResultOptions,
    oeaItemStatusOptions,
    oeaSectionLabels,
    oeaResult: (v?: string) => find(oeaResultOptions, v),
    oeaItemStatus: (v?: string) => find(oeaItemStatusOptions, v),
    sectionLabel: (v?: string) => oeaSectionLabels[v ?? ""] ?? v ?? "-",
  };
};
