import { useGeneralStore } from "~/stores/general";
import { unwrapBlobError } from "~/composables/useApiError";

/** Una fila que el backend no pudo aceptar, con el motivo. */
export interface ExcelImportError {
  fila: number;
  columna?: string;
  motivo: string;
}

/** Resumen que devuelve el backend, tanto en la simulación como en la carga. */
export interface ExcelImportResult {
  procesadas: number;
  creados: number;
  actualizados: number;
  omitidos: number;
  errores: ExcelImportError[];
  simulacion: boolean;
  /**
   * La validación pasó pero un guardado falló: quedaron filas escritas antes
   * del corte. Se avisa distinto que un error de validación, porque lo que
   * tiene que hacer el usuario no es lo mismo.
   */
  interrumpido: boolean;
}

/**
 * Descarga y carga de planillas.
 *
 * Concentra el `Blob` → `<a download>` que antes estaba copiado en cada store.
 * Los errores pasan por `unwrapBlobError`: sin eso el mensaje del backend —"la
 * descarga supera las 50.000 filas"— llega como `[object Blob]`.
 */
export const useExcel = () => {
  const general = useGeneralStore();

  /** Dispara la descarga del archivo en el navegador. */
  const guardarArchivo = (data: BlobPart, nombre: string) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", nombre);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Baja un Excel del backend.
   *
   * `params` son los filtros de la tabla: el endpoint ignora la paginación pero
   * respeta los filtros, así que lo que baja es exactamente lo que se ve.
   */
  const descargar = async (
    url: string,
    nombre: string,
    params: Record<string, any> = {},
  ): Promise<boolean> => {
    const { $api } = useNuxtApp();
    try {
      const resp = await $api.get(url, {
        // Los `undefined` no viajan; los vacíos sí lo harían y filtrarían de más.
        params: limpiar(params),
        responseType: "blob",
      });
      guardarArchivo(resp.data, nombre);
      return true;
    } catch (e) {
      general.setErrorSnackbar(await unwrapBlobError(e));
      return false;
    }
  };

  /**
   * Sube una planilla.
   *
   * Con `dryRun` el backend valida y devuelve el resumen sin escribir nada: la
   * pantalla siempre pega primero así, muestra qué va a pasar y recién entonces
   * confirma. Devuelve `null` si la petición falló (el error ya se avisó).
   */
  const subir = async (
    url: string,
    file: File,
    dryRun: boolean,
  ): Promise<ExcelImportResult | null> => {
    const { $api } = useNuxtApp();
    const form = new FormData();
    form.append("file", file);
    try {
      const resp = await $api.post(url, form, {
        params: { dryRun },
        headers: { "Content-Type": "multipart/form-data" },
      });
      return resp.data as ExcelImportResult;
    } catch (e) {
      general.setErrorSnackbar(e);
      return null;
    }
  };

  /** Resumen en una línea para el snackbar de "carga terminada". */
  const resumen = (r: ExcelImportResult): string => {
    const partes: string[] = [];
    if (r.creados) partes.push(`${r.creados} creados`);
    if (r.actualizados) partes.push(`${r.actualizados} actualizados`);
    if (r.omitidos) partes.push(`${r.omitidos} sin cambios`);
    return partes.length ? partes.join(", ") : "No había filas para cargar";
  };

  return { descargar, subir, resumen };
};

/** Saca los filtros vacíos para que no viajen como `?status=`. */
function limpiar(params: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
}

/** Extensiones que acepta el input de archivos. */
export const EXCEL_ACCEPT = ".xlsx,.xls,.csv";
