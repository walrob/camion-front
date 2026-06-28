import type { StatusOption } from "~/composables/useFleetStatus";

export const ownerTypeOptions: StatusOption[] = [
  { value: "truck", label: "Camión", color: "primary" },
  { value: "trailer", label: "Acoplado", color: "info" },
  { value: "driver", label: "Chofer", color: "secondary" },
  { value: "company", label: "Empresa", color: "grey" },
];

export const documentCategoryOptions: StatusOption[] = [
  { value: "insurance", label: "Seguro", color: "primary" },
  { value: "vtv", label: "VTV", color: "info" },
  { value: "license", label: "Licencia", color: "secondary" },
  { value: "id_card", label: "Carnet / DNI", color: "secondary" },
  { value: "permit", label: "Habilitación", color: "warning" },
  { value: "delivery_note", label: "Remito", color: "grey" },
  { value: "waybill", label: "Carta de porte", color: "grey" },
  { value: "other", label: "Otro", color: "grey" },
];

export const documentStatusOptions: StatusOption[] = [
  { value: "valid", label: "Vigente", color: "success" },
  { value: "expiring", label: "Por vencer", color: "warning" },
  { value: "expired", label: "Vencido", color: "error" },
];

export const useDocumentStatus = () => {
  const find = (opts: StatusOption[], v?: string) =>
    opts.find((o) => o.value === v) ?? { value: v ?? "", label: v ?? "-", color: "grey" };
  return {
    ownerTypeOptions,
    documentCategoryOptions,
    documentStatusOptions,
    ownerType: (v?: string) => find(ownerTypeOptions, v),
    documentCategory: (v?: string) => find(documentCategoryOptions, v),
    documentStatus: (v?: string) => find(documentStatusOptions, v),
  };
};
