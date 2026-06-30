import type { StatusOption } from "~/composables/useFleetStatus";

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
  return {
    fuelTypeOptions,
    fuelType: (v?: string) =>
      (fuelTypeOptions.find((o) => o.value === v) ?? {
        value: v ?? "",
        label: v ?? "-",
        color: "grey",
        icon: "mdi-gas-station",
      }) as FuelTypeOption,
  };
};
