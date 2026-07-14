// Formateadores de presentación compartidos por las páginas (montos, cantidades,
// fechas). Centraliza las variantes que antes se copiaban inline en cada página:
//  - money:      monto con separador de miles es-AR y sin decimales ("$ 1.234")
//  - moneyFixed: monto con dos decimales ("$ 1234.00") — usado en rendiciones/OT
//  - moneyK:     eje compacto en miles ("$250k") para gráficos con montos grandes
//  - num:        cantidad con separador es-AR; "s/d" cuando el valor es nulo
//  - fmtDate:    fecha corta es-AR ("dd/mm/aaaa"); "-" cuando no hay valor
export const useFormatters = () => {
  const money = (n?: number | null) =>
    `$ ${Number(n ?? 0).toLocaleString("es-AR")}`;

  const moneyFixed = (n?: number | null) => `$ ${Number(n ?? 0).toFixed(2)}`;

  const moneyK = (v: unknown) => {
    const n = Number(v) || 0;
    return `$${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}k`;
  };

  const num = (n?: number | null) =>
    n == null ? "s/d" : Number(n).toLocaleString("es-AR");

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("es-AR") : "-";

  return { money, moneyFixed, moneyK, num, fmtDate };
};
