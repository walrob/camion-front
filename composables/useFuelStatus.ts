import type { StatusOption } from "~/composables/useFleetStatus";
import { useCatalogStore, CATALOG } from "~/stores/catalog";

export interface FuelTypeOption extends StatusOption {
  icon: string;
}

export const fuelTypeOptions: FuelTypeOption[] = [
  { value: "diesel", label: "Diésel", color: "primary", icon: "mdi-gas-station" },
  { value: "gasoline", label: "Nafta", color: "info", icon: "mdi-fuel" },
  { value: "gnc", label: "GNC", color: "success", icon: "mdi-gas-cylinder" },
  { value: "adblue", label: "AdBlue", color: "secondary", icon: "mdi-water" },
];

export const useFuelStatus = () => {
  // Los tipos los define cada empresa (docs/CONFIGURACION.md §5): una flota a
  // GNC o eléctrica no usa la misma lista.
  const catalogs = useCatalogStore();

  return {
    fuelTypeOptions,
    fuelType: (v?: string) => {
      const item = catalogs.todos(CATALOG.FUEL_TYPE).find((i) => i.key === v);
      if (item) {
        return {
          value: item.key,
          label: item.label,
          color: item.color ?? "grey",
          icon: item.icon ?? "mdi-gas-station",
        } as FuelTypeOption;
      }
      return (fuelTypeOptions.find((o) => o.value === v) ?? {
        value: v ?? "",
        label: v ?? "-",
        color: "grey",
        icon: "mdi-gas-station",
      }) as FuelTypeOption;
    },
  };
};
