// Etiquetas/colores del dominio de RRHH (DRY entre tablas, chips y selects).
import type { StatusOption } from "~/composables/useFleetStatus";

export const positionOptions: StatusOption[] = [
  { value: "driver", label: "Chofer", color: "primary" },
  { value: "mechanic", label: "Mecánico", color: "info" },
  { value: "dispatcher", label: "Despachante", color: "secondary" },
  { value: "admin", label: "Administrativo", color: "grey" },
  { value: "other", label: "Otro", color: "grey" },
];

export const employmentStatusOptions: StatusOption[] = [
  { value: "active", label: "Activo", color: "success" },
  { value: "on_leave", label: "Licencia", color: "warning" },
  { value: "suspended", label: "Suspendido", color: "error" },
  { value: "terminated", label: "Baja", color: "grey" },
];

export const certificationTypeOptions: StatusOption[] = [
  { value: "driving_license", label: "Carnet de conducir", color: "primary" },
  { value: "professional_license", label: "Licencia profesional (LiNTI)", color: "primary" },
  { value: "dangerous_goods", label: "Carga peligrosa", color: "error" },
  { value: "medical_exam", label: "Psicofísico", color: "info" },
  { value: "hazmat", label: "HazMat", color: "error" },
  { value: "crane_operator", label: "Operador de grúa", color: "secondary" },
  { value: "defensive_driving", label: "Manejo defensivo", color: "info" },
  { value: "first_aid", label: "Primeros auxilios", color: "info" },
  { value: "other", label: "Otro", color: "grey" },
];

export const certificationStatusOptions: StatusOption[] = [
  { value: "valid", label: "Vigente", color: "success" },
  { value: "expiring", label: "Por vencer", color: "warning" },
  { value: "expired", label: "Vencido", color: "error" },
];

export const useHrStatus = () => {
  const find = (opts: StatusOption[], v?: string) =>
    opts.find((o) => o.value === v) ?? { value: v ?? "", label: v ?? "-", color: "grey" };

  return {
    positionOptions,
    employmentStatusOptions,
    certificationTypeOptions,
    certificationStatusOptions,
    position: (v?: string) => find(positionOptions, v),
    employmentStatus: (v?: string) => find(employmentStatusOptions, v),
    certificationType: (v?: string) => find(certificationTypeOptions, v),
    certificationStatus: (v?: string) => find(certificationStatusOptions, v),
  };
};
