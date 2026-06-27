// Etiquetas y colores de los estados del dominio de flota. Reutilizable en
// tablas, chips y selects de diálogos (DRY).

export interface StatusOption {
  value: string;
  label: string;
  color: string;
}

export const truckStatusOptions: StatusOption[] = [
  { value: "available", label: "Disponible", color: "success" },
  { value: "on_trip", label: "En viaje", color: "primary" },
  { value: "stopped", label: "Detenido", color: "warning" },
  { value: "workshop", label: "En taller", color: "info" },
  { value: "out_of_service", label: "Fuera de servicio", color: "error" },
];

export const trailerStatusOptions: StatusOption[] = [
  { value: "available", label: "Disponible", color: "success" },
  { value: "in_use", label: "En uso", color: "primary" },
  { value: "workshop", label: "En taller", color: "info" },
  { value: "out_of_service", label: "Fuera de servicio", color: "error" },
];

export const driverStatusOptions: StatusOption[] = [
  { value: "active", label: "Activo", color: "success" },
  { value: "on_trip", label: "En viaje", color: "primary" },
  { value: "inactive", label: "Inactivo", color: "grey" },
];

export const useFleetStatus = () => {
  const find = (options: StatusOption[], value?: string) =>
    options.find((o) => o.value === value);

  return {
    truckStatusOptions,
    trailerStatusOptions,
    driverStatusOptions,
    truckStatus: (v?: string) =>
      find(truckStatusOptions, v) ?? { value: v ?? "", label: v ?? "-", color: "grey" },
    trailerStatus: (v?: string) =>
      find(trailerStatusOptions, v) ?? { value: v ?? "", label: v ?? "-", color: "grey" },
    driverStatus: (v?: string) =>
      find(driverStatusOptions, v) ?? { value: v ?? "", label: v ?? "-", color: "grey" },
  };
};
