import type { Driver } from "~/types/fleet";

/**
 * Nombre visible de un chofer. En el modelo "todo chofer es un empleado", el
 * dato personal vive en el Employee de RRHH (`driver.employee`), no en el Driver.
 * Cae a la licencia o al id si la relación no vino embebida.
 */
export function driverName(driver?: Partial<Driver> | null): string {
  if (!driver) return "-";
  const emp = driver.employee;
  const full = `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim();
  return full || driver.licenseNumber || (driver as any).id || "-";
}
