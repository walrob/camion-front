import type { StatusOption } from "~/composables/useFleetStatus";

export interface IncidentTypeOption extends StatusOption {
  icon: string;
}

export const incidentTypeOptions: IncidentTypeOption[] = [
  { value: "mechanical", label: "Rotura mecánica", color: "warning", icon: "mdi-wrench" },
  { value: "accident", label: "Accidente", color: "error", icon: "mdi-car-emergency" },
  { value: "cash_shortage", label: "Falta de dinero", color: "info", icon: "mdi-cash-remove" },
  { value: "delay", label: "Retraso", color: "secondary", icon: "mdi-clock-alert" },
  { value: "cargo_issue", label: "Problema con carga", color: "warning", icon: "mdi-package-variant-closed-remove" },
  { value: "client_issue", label: "Problema con cliente", color: "info", icon: "mdi-account-alert" },
  { value: "emergency", label: "Emergencia", color: "error", icon: "mdi-alarm-light" },
];

export const incidentSeverityOptions: StatusOption[] = [
  { value: "low", label: "Baja", color: "grey" },
  { value: "medium", label: "Media", color: "info" },
  { value: "high", label: "Alta", color: "warning" },
  { value: "critical", label: "Crítica", color: "error" },
];

export const incidentStatusOptions: StatusOption[] = [
  { value: "pending", label: "Pendiente", color: "error" },
  { value: "in_progress", label: "En proceso", color: "warning" },
  { value: "resolved", label: "Resuelto", color: "success" },
];

// Traducción de los tipos de evento del historial del incidente.
export const incidentEventLabels: Record<string, string> = {
  created: "Creado",
  assigned: "Asignado",
  status_changed: "Cambio de estado",
  severity_changed: "Cambio de severidad",
  commented: "Comentario",
  comment: "Comentario",
  resolved: "Resuelto",
  reopened: "Reabierto",
  attachment_added: "Evidencia agregada",
};

export const incidentEventLabel = (action?: string) =>
  incidentEventLabels[action ?? ""] ?? action ?? "-";

export const useIncidentStatus = () => {
  const find = (opts: StatusOption[], v?: string) =>
    opts.find((o) => o.value === v) ?? { value: v ?? "", label: v ?? "-", color: "grey" };

  return {
    incidentTypeOptions,
    incidentSeverityOptions,
    incidentStatusOptions,
    incidentEventLabel,
    incidentType: (v?: string) =>
      (incidentTypeOptions.find((o) => o.value === v) ?? {
        value: v ?? "",
        label: v ?? "-",
        color: "grey",
        icon: "mdi-alert",
      }) as IncidentTypeOption,
    incidentSeverity: (v?: string) => find(incidentSeverityOptions, v),
    incidentStatus: (v?: string) => find(incidentStatusOptions, v),
  };
};
