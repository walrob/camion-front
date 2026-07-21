// Formateadores de presentación compartidos por las páginas (montos, cantidades,
// fechas). Centraliza las variantes que antes se copiaban inline en cada página:
//  - money:      monto ARS sin decimales ("$ 1.234")
//  - moneyFixed: monto ARS con dos decimales ("$ 1.234,50") — rendiciones/OT
//  - moneyK:     eje compacto en miles ("$250k") para gráficos con montos grandes
//  - num:        cantidad con separador es-AR; "s/d" cuando el valor es nulo
//  - fmtDate:     fecha corta ("20/05/2026"); "-" cuando no hay valor
//  - fmtDateTime: fecha corta + hora ("20/05/2026 14:35")
//
// Todo lo que sea plata sale de acá, siempre en formato argentino: miles con
// punto y decimales con coma. Delegan en formatCurrency*ARS (composables/
// functions.ts), que usa Intl con currency ARS; no usar `toFixed`, que imprime
// el punto decimal inglés ("$ 1234.00").
export const useFormatters = () => {
  const money = (n?: number | null) => formatCurrencySmallARS(Number(n ?? 0));

  const moneyFixed = (n?: number | null) => formatCurrencyARS(Number(n ?? 0));

  const moneyK = (v: unknown) => {
    const n = Number(v) || 0;
    return `$${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}k`;
  };

  const num = (n?: number | null) =>
    n == null ? "s/d" : Number(n).toLocaleString("es-AR");

  // Delegan en formatDateLocal/formatHourLocal (composables/functions.ts), que es
  // el único formateador de fechas de la app. Importa que sea ese y no
  // `new Date(str).toLocaleDateString()`: para una fecha sin hora ("2026-05-20")
  // el constructor la interpreta como medianoche UTC y en Argentina (UTC-3)
  // la muestra un día antes. formatDateLocal parte el string a mano y lo evita.
  const fmtDate = (d?: string | null) => formatDateLocal(d ?? null) || "-";

  const fmtDateTime = (d?: string | null) => {
    if (!d) return "-";
    const date = formatDateLocal(d);
    // Sin hora en el string (fecha pura) no hay nada que agregar.
    return d.includes("T") ? `${date} ${formatHourLocal(d)}` : date;
  };

  return { money, moneyFixed, moneyK, num, fmtDate, fmtDateTime };
};
