import type { StatusOption } from "~/composables/useFleetStatus";
import { useCatalogStore, CATALOG, INCIDENT_TYPE_FALLBACK } from "~/stores/catalog";

export interface IncidentTypeOption extends StatusOption {
  icon: string;
}

/**
 * Los tipos que trae el producto. La lista real de cada empresa sale de su
 * catálogo (docs/CONFIGURACION.md §5): esto es el respaldo.
 */
export const incidentTypeOptions: IncidentTypeOption[] = INCIDENT_TYPE_FALLBACK.map(
  (i) => ({
    value: i.key,
    label: i.label,
    color: i.color ?? "grey",
    icon: i.icon ?? "mdi-alert",
  }),
);

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

  // El tipo lo define cada empresa (docs/CONFIGURACION.md §5): se resuelve
  // contra su catálogo y sólo se cae a la constante si todavía no cargó —o si
  // el chofer está sin señal y sin caché—.
  const catalogs = useCatalogStore();

  return {
    incidentTypeOptions,
    incidentSeverityOptions,
    incidentStatusOptions,
    incidentEventLabel,
    incidentType: (v?: string) => {
      const delCatalogo = catalogs.todos(CATALOG.INCIDENT_TYPE).find((i) => i.key === v);
      if (delCatalogo) {
        return {
          value: delCatalogo.key,
          label: delCatalogo.label,
          color: delCatalogo.color ?? "grey",
          icon: delCatalogo.icon ?? "mdi-alert",
        } as IncidentTypeOption;
      }
      return (incidentTypeOptions.find((o) => o.value === v) ?? {
        value: v ?? "",
        label: v ?? "-",
        color: "grey",
        icon: "mdi-alert",
      }) as IncidentTypeOption;
    },
    incidentSeverity: (v?: string) => find(incidentSeverityOptions, v),
    incidentStatus: (v?: string) => find(incidentStatusOptions, v),
  };
};
