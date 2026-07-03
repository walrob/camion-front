// Rango de fechas por defecto para precargar los filtros de los reportes:
// los últimos N días (por defecto 30). Devuelve fechas locales en formato
// 'YYYY-MM-DD' (no UTC, para no correr el día en zonas horarias negativas).
const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export const lastNDaysRange = (days = 30): { from: string; to: string } => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: toISODate(from), to: toISODate(to) };
};
