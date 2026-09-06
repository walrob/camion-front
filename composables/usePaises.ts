/**
 * Países de destino del viaje internacional (docs/CONFIGURACION.md §7.6).
 *
 * No es un catálogo de empresa: un país no es vocabulario propio de nadie, así
 * que vive en el código igual que las monedas conocidas. Si alguna operación
 * necesita destinos fuera de la región, deja de ser una constante y pasa a ser
 * un catálogo más (§5).
 *
 * La clave es el ISO 3166-1 alfa-2, que es lo que después consume `PerDiemRate`
 * para proponer el viático por país (§6.5).
 */
export interface Pais {
  code: string;
  label: string;
}

export const PAISES: Pais[] = [
  { code: "AR", label: "Argentina" },
  { code: "BO", label: "Bolivia" },
  { code: "BR", label: "Brasil" },
  { code: "CL", label: "Chile" },
  { code: "CO", label: "Colombia" },
  { code: "EC", label: "Ecuador" },
  { code: "PE", label: "Perú" },
  { code: "PY", label: "Paraguay" },
  { code: "UY", label: "Uruguay" },
  { code: "VE", label: "Venezuela" },
];

export const usePaises = () => ({
  paises: PAISES,

  /** Nombre legible; si el código no está en la lista, se muestra el código. */
  nombrePais: (code?: string | null): string =>
    PAISES.find((p) => p.code === code)?.label ?? code ?? "",
});
