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

// Rango centrado en hoy: `before` días hacia atrás y `after` días hacia adelante.
// Útil para listas por fecha planificada (ej. viajes), donde interesa ver tanto
// lo reciente como lo próximo a ocurrir.
export const dayOffsetRange = (
  before: number,
  after: number,
): { from: string; to: string } => {
  const from = new Date();
  from.setDate(from.getDate() - before);
  const to = new Date();
  to.setDate(to.getDate() + after);
  return { from: toISODate(from), to: toISODate(to) };
};
