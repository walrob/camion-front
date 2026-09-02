// Formateadores de presentación compartidos por las páginas (montos, cantidades,
// fechas). Centraliza las variantes que antes se copiaban inline en cada página:
//  - money:      monto ARS sin decimales ("$ 1.234")
//  - moneyFixed: monto ARS con dos decimales ("$ 1.234,50") — rendiciones/OT
//  - moneyK:     eje compacto en miles ("$250k") para gráficos con montos grandes
//  - num:        cantidad con separador es-AR; "s/d" cuando el valor es nulo
//  - fmtDate:     fecha corta ("20/05/2026"); "-" cuando no hay valor
//  - fmtDateTime: fecha corta + hora ("20/05/2026 14:35")
//
// El formato (separadores, orden de la fecha) sale del ajuste `locale.locale` de
// la empresa; `es-AR` es el default y lo que se usaba antes.
//
// Todo lo que sea plata sale de acá. En la moneda base de la empresa delegan en
// formatCurrency*ARS (composables/functions.ts); con una moneda distinta —un
// peaje en guaraníes— formatean con `Intl` en esa moneda. Nunca `toFixed`, que
// imprime el punto decimal inglés ("$ 1234.00").
import { useSettingsStore } from "~/stores/settings";
/** Monedas sin decimales: mostrar «₲ 1.500,00» delata que no se las entiende. */
const SIN_DECIMALES = ["PYG", "CLP", "JPY", "KRW"];

export const useFormatters = () => {
  /**
   * Formato de números y fechas de la empresa (`locale.locale`,
   * docs/CONFIGURACION.md §4.5). Cae en `es-AR` mientras los ajustes no
   * cargaron —o si el chofer está sin señal—, que es lo que se usaba antes.
   */
  const locale = () => useSettingsStore().str("locale.locale") || "es-AR";

  /**
   * Con `currency` explícito se formatea en esa moneda: un peaje en guaraníes
   * se muestra como guaraníes, y sin decimales, porque el guaraní no los usa
   * (docs/CONFIGURACION.md §7.4). Sin `currency` sigue siendo pesos, que es lo
   * que ve el 99 % de las pantallas.
   */
  const enMoneda = (
    n: number | null | undefined,
    currency: string,
    decimales: number,
  ) =>
    new Intl.NumberFormat(locale(), {
      style: "currency",
      currency,
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(Number(n ?? 0));

  const money = (n?: number | null, currency?: string) =>
    currency && currency !== "ARS"
      ? enMoneda(n, currency, SIN_DECIMALES.includes(currency) ? 0 : 0)
      : formatCurrencySmallARS(Number(n ?? 0));

  const moneyFixed = (n?: number | null, currency?: string) =>
    currency && currency !== "ARS"
      ? enMoneda(n, currency, SIN_DECIMALES.includes(currency) ? 0 : 2)
      : formatCurrencyARS(Number(n ?? 0));

  const moneyK = (v: unknown) => {
    const n = Number(v) || 0;
    return `$${(n / 1000).toLocaleString(locale(), { maximumFractionDigits: 1 })}k`;
  };

  const num = (n?: number | null) =>
    n == null ? "s/d" : Number(n).toLocaleString(locale());

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
